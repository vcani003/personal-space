import { Meta } from "../components/Meta";
import { Link } from "../router";
import styles from "./Spatial.module.css";

/**
 * A page that does not exist.
 *
 * IT IS NOT AN ERROR SCREEN. There is no code, no apology and no diagram of a
 * broken robot — it is one line in the site's own voice and a way back, which
 * is all a visitor who mistyped a URL actually needs.
 *
 * It borrows the project page's stylesheet deliberately. A second stylesheet
 * for two elements would be a second place for the reading column's measure
 * and rhythm to drift out of agreement with the first.
 */
export function NotFound() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Meta tracking="wide" dataText="meta">
          Not here
        </Meta>
        <h1 className={styles.title} data-route-heading data-text="display">
          Nothing at this address
        </h1>
        <p className={styles.standfirst} data-text="body">
          Which is its own kind of place to end up.
        </p>
      </header>

      <p className={styles.back}>
        <Link to="home" className={styles.backLink}>
          <Meta dataText="meta">Back</Meta>
        </Link>
      </p>
    </main>
  );
}
