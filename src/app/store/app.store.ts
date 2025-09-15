import { computed, inject } from "@angular/core";
import { patchState, signalStore, withComputed, withHooks, withMethods, withProps, withState } from "@ngrx/signals";
import { DictionariesService } from "../services/dictionaries.service";
import { getDictionary } from "./app.helpers";
import { initialAppSlice } from "./app.slice";
import { changeLanguage, resetLanguages, setBusy, setDictionary } from "./app.updaters";
import { firstValueFrom } from "rxjs";

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
      const _invalidateDictionary = async() => {
          patchState(store, setBusy(true));
          const dicionary = await firstValueFrom(store._dictionaries.getDictionaryWithDelay(store.selectedLanguage()))
          patchState(store, setDictionary(dicionary), setBusy(false));
      }

      return {
        changeLanguage: async() => {
          patchState(store, changeLanguage(store._languages))
          await _invalidateDictionary();
        },
        _resetLanguages: async() => {
          patchState(store, resetLanguages(store._languages))
          await _invalidateDictionary();
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
