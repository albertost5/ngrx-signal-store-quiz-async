import { SignalStoreFeature, signalStoreFeature, withComputed, withState } from "@ngrx/signals"
import { BusySlice, initialBusySlice } from "./with-busy.slice";
import { computed, Signal } from "@angular/core";

export function withBusyFeature(): SignalStoreFeature<{
  state: {},
  props: {},
  methods: {},
}, {
  state: BusySlice,
  props: {
    isIdle: Signal<boolean>
  },
  methods: {}
}>;

export function withBusyFeature(): SignalStoreFeature {
  return signalStoreFeature(
    withState(initialBusySlice),
    withComputed(store => ({
      isIdle: computed(() => !store.isBusy())
    }))
  );
}
