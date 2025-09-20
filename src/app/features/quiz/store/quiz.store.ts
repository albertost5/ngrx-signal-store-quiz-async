import { withDevtools } from "@angular-architects/ngrx-toolkit";
import { computed, inject } from "@angular/core";
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { exhaustMap, generate, tap } from "rxjs";
import { withBusyFeature } from "../../../custom-features/with-busy/with-busy.feature";
import { setBusy, setIdle } from "../../../custom-features/with-busy/with-busy.updaters";
import { withLocalStorageFeature } from "../../../custom-features/with-local-storate.feature";
import { QUESTION_CAPTION } from "../../../data/dictionaries";
import { ColorQuizGeneratorService } from "../../../services/color-quiz-generator.service";
import { translate, translateToPairs } from "../../../store/app.helpers";
import { AppStore } from "../../../store/app.store";
import { getCorrectCount } from "./quiz.helpers";
import { initialQuizSlice } from "./quiz.slice";
import { addAnswer, resetQuestions, resetQuiz } from "./quiz.updaters";
import { withService } from "../../../custom-features/with-service/with-service.feature";

export const QuizStore = signalStore(
    withState(initialQuizSlice),
    withBusyFeature(),
    withService(
      () => inject(ColorQuizGeneratorService).createRandomQuizAsync(),
      (questions) => resetQuestions(questions)
    ),
    // withProps(_ => ({
    //   colorQuizGeneratorService: inject(ColorQuizGeneratorService)
    // })),
    withComputed((store) => {
        const appStore = inject(AppStore);
        const dictionary = appStore.selectedDictionary;

        const currentQuestionIndex = computed(() => store.answers().length);
        const isDone = computed(() => store.answers().length === store.questions().length);
        const currentQuestion = computed(() => store.questions()[currentQuestionIndex()]);
        const questionsCount = computed(() => store.questions().length);
        const correctCount = computed(() => getCorrectCount(store.answers(), store.questions()));
        const title = computed(() => translate(QUESTION_CAPTION, dictionary()));
        const captionColors = computed(() => translateToPairs(currentQuestion().caption, dictionary()));
        const answerColors = computed(() => translateToPairs(currentQuestion().answers, dictionary()));

        return {
            currentQuestionIndex,
            isDone,
            currentQuestion,
            questionsCount,
            correctCount,
            title,
            captionColors,
            answerColors
        }
    }),
    withMethods(store => ({
        addAnswer: (index: number) => patchState(store, addAnswer(index)),
        reset: () => patchState(store, resetQuiz()),
        generateQuiz: () => store._load(),
        // generateQuiz: rxMethod<void>(trigger$ => trigger$.pipe(
        //   tap(() => {
        //     patchState(store, setBusy()),
        //     console.log('Generating new quiz...');
        //   }),
        //   exhaustMap(() => store.colorQuizGeneratorService.createRandomQuizAsync()),
        //   tap((questions) => {
        //     console.log('New quiz generated.');
        //     patchState(store, resetQuestions(questions), setIdle())
        //   }),
        // ))
    })),
    withLocalStorageFeature('quiz-store'),
    withDevtools('quiz-store'),
);


