import { inject } from "@angular/core";
import { patchState, signalStore, withHooks, withMethods, withProps, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap, tap } from "rxjs";
import { DictionariesService } from "../services/dictionaries.service";
import { initialAppSlice } from "./app.slice";
import { changeLanguage, resetLanguages, setBusy, setDictionary } from "./app.updaters";

export const AppStore = signalStore(
    { providedIn: 'root' },
    withState(initialAppSlice),
    withProps(_ => {
        const _dictionaries = inject(DictionariesService);
        const _languages = _dictionaries.languages;

        return {
            _dictionaries, _languages
        }
    }),
    withMethods(store => {
      const _invalidateDictionary = rxMethod<string>(
        pipe(
          tap((language) => {
            console.log(`Loading dictionary for ${language}`);
            patchState(store, setBusy(true));
          }),
          switchMap(language => store._dictionaries.getDictionaryWithDelay(language)),
          tap((dictionary) => {
            console.log(`Dictionary loaded for ${store.selectedLanguage()}`, dictionary);
            patchState(store, setBusy(false), setDictionary(dictionary));
          })
        )
      );

      return {
        changeLanguage: () => {
          patchState(store, changeLanguage(store._languages))
          _invalidateDictionary(store.selectedLanguage());
        },
        _resetLanguages: () => {
          patchState(store, resetLanguages(store._languages))
          _invalidateDictionary(store.selectedLanguage());
        },
        _invalidateDictionary
      }
    }),
    withHooks(store => ({
        onInit: () => {
            store._resetLanguages();
        }
    }))
)
