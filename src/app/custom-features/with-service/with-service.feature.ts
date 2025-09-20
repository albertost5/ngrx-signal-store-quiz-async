import { tapResponse } from "@ngrx/operators";
import { PartialStateUpdater, patchState, Prettify, SignalStoreFeature, signalStoreFeature, type, withMethods } from "@ngrx/signals";
import { RxMethod, rxMethod } from "@ngrx/signals/rxjs-interop";
import { exhaustMap, Observable, tap } from "rxjs";
import { BusySlice } from "../with-busy/with-busy.slice";
import { setBusy, setIdle } from "../with-busy/with-busy.updaters";

/**
 * A feature that loads data from a service and updates the state with the result.
 *
 * @param loader A function that returns an observable which loads the data.
 * @param updater A function that takes the loaded data and returns a partial state update.
 *
 * @returns A feature that can be used with `signalStore` to load data from a service and update the state.
 */

type Update<S extends object> = Partial<Prettify<S>> | PartialStateUpdater<Prettify<S>>;

export function withService<T, S extends object>(
  loader: () => Observable<T>,
  updater: (data: T) => Update<S>
): SignalStoreFeature<
  {
    state: BusySlice & S,
    props: {},
    methods: {}
  },
  {
    state: {},
    props: {},
    methods: {
      _load: RxMethod<void>;
    }
  }
>;

export function withService<T, S extends object>(
  loader: () => Observable<T>,
  updater: (data: T) => Update<S>
) {
  return signalStoreFeature(
    { state: type<S & BusySlice>() },
    withMethods((store) => {
      // Injection context
      const source$ = loader();

      return {
        _load: rxMethod<void>(trigger$ => trigger$.pipe(
          tap(() => {
            patchState(store, setBusy() as any),
            console.log('Generating new quiz...');
          }),
          exhaustMap(() => source$.pipe(
            tapResponse({
              next: (data) => {
                console.log('New quiz generated.');
                patchState(store, updater(data))
              },
              error: (error) => {
                console.error('Error loading data:', error);
                patchState(store, setIdle() as any);
              },
              finalize: () => patchState(store, setIdle() as any)
            })
          ))
        ))
      }
    }
  ))
}
