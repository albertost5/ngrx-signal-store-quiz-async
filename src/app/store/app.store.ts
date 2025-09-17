import { inject } from "@angular/core";
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { DictionariesService } from "../services/dictionaries.service";
import { tapResponse } from '@ngrx/operators';
import { initialAppSlice } from "./app.slice";
import { changeLanguage, resetLanguages, setDictionary } from "./app.updaters";
import { NotificationsService } from "../services/notification.service";
import { withDevtools } from '@angular-architects/ngrx-toolkit';
import { withBusyFeature } from "../custom-features/with-busy/with-busy.feature";
import { setBusy, setIdle } from "../custom-features/with-busy/with-busy.updaters";

export const AppStore = signalStore(
    { providedIn: 'root' },
    withState(initialAppSlice),
    withBusyFeature(),
    withProps(_ => {
        const _dictionaries = inject(DictionariesService);
        const _languages = _dictionaries.languages;

        return {
            _dictionaries,
            _languages,
            _notificationsService: inject(NotificationsService),
        }
    }),
    withMethods(store => {
      const _invalidateDictionary = rxMethod<string>(
        pipe(
          tap((language) => {
            console.log(`Loading dictionary for ${language}`);
            patchState(store, setBusy());
          }),
          switchMap(language => store._dictionaries.getDictionaryWithDelay(language).pipe(tapResponse({
            next: (dictionary) => {
              console.log(`Dictionary loaded for ${store.selectedLanguage()}`, dictionary);
              patchState(store, setIdle(), setDictionary(dictionary));
            },
            error: (error) => {
              console.error(`Error loading dictionary for ${store.selectedLanguage()}`, error);
              patchState(store, setIdle());
            }
          }))),
        )
      );

      _invalidateDictionary(store.selectedLanguage);

      return {
        changeLanguage: () => patchState(store, changeLanguage(store._languages)),
        _resetLanguages: () => patchState(store, resetLanguages(store._languages)),
        _invalidateDictionary
      }
    }),
    withHooks(store => ({
        onInit: () => {
            store._resetLanguages();
        }
    })),
    withDevtools('app-store'),
)
