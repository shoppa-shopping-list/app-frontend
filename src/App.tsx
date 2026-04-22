import styles from './App.module.scss';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { decrement, increment } from '@/features/counter/counterSlice';

function App() {
  const value = useAppSelector((state) => state.counter.value);
  const dispatch = useAppDispatch();

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>React starter</h1>
        <p className={styles.text}>React 19 + TypeScript + RTK + SCSS + Jest + CI</p>

        <p className={styles.counter}>Счётчик: {value}</p>

        <div className={styles.actions}>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            type="button"
            onClick={() => dispatch(decrement())}
          >
            -
          </button>

          <button className={styles.button} type="button" onClick={() => dispatch(increment())}>
            +
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;
