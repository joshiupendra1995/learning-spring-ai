# learning-spring-ai

## Run the application

The project targets Java 21. Run it with:

```sh
./backend/mvnw -f backend/pom.xml spring-boot:run
```

When using JDK 25, explicitly enable Lombok annotation processing:

```sh
./backend/mvnw -f backend/pom.xml -Dmaven.compiler.proc=full spring-boot:run
```

The chat and pull request review pages are a React application built with Vite.
Maven installs the frontend toolchain and builds the React assets into
`backend/target/classes/static` before packaging or running the application.

Open `http://localhost:8080/` for chat or `http://localhost:8080/pr-review`
for pull request reviews. Both pages continue to use the Spring API endpoints
under `/api/ai`.

## Apply fixes to a pull request

Applying fixes requires an authenticated GitHub token with permission to read
the pull request and push commits to its head repository. Public repositories
can be reviewed without write access, but public visibility does not allow
anonymous pushes.

Create a fine-grained personal access token for the repository containing the
PR's head branch and grant:

- **Pull requests: Read-only**
- **Contents: Read and write**

The token must be allowed to push to the PR's head branch. For a classic
personal access token, use the `repo` scope. Keep the token private and do not
commit it to the repository.

Fix generation and pushes are disabled unless `GITHUB_WRITE_ENABLED` is set to
`true`. Set both environment variables before starting the backend:

```sh
export GITHUB_TOKEN=your-github-token
export GITHUB_WRITE_ENABLED=true
./backend/mvnw -f backend/pom.xml spring-boot:run
```

If you start the app from IntelliJ IDEA, add `GITHUB_TOKEN` and
`GITHUB_WRITE_ENABLED=true` to the run configuration's environment variables;
shell exports are not automatically available to IntelliJ. Restart Spring
Boot after changing either variable.

### Test the workflow in the UI

1. Start the backend with `GITHUB_TOKEN` and `GITHUB_WRITE_ENABLED=true` set.
2. Open `http://localhost:8080/pr-review`. If you are running the Vite
   frontend for development, open `http://localhost:5173/` instead.
3. Enter the URL of an **open** pull request and run the review.
4. After the review finishes, select one or more findings and choose
   **Prepare selected fixes**.
5. Review the proposed changes in the preview. Nothing is pushed at this step.
6. To apply them, choose **Confirm and push to PR** and confirm the browser
   prompt. The app creates a commit on the pull request's head branch; verify
   the new commit appears in the PR.

Use a test PR where you are comfortable pushing a commit. The token needs
write access to the repository that owns the PR's head branch (which may differ
from the base repository for fork-based PRs). If fix actions are unavailable,
check that the app was restarted with both environment variables set and that
the token has the required repository permissions.

The app binds to `127.0.0.1` by default. Keep it local when write access is
enabled; this workflow does not provide user authentication for shared or
deployed access. After a review, select findings to fix, inspect the proposed
changes, and explicitly confirm the push. The commit is added to the PR's head
branch. Only open PRs are supported, and each preview expires after 10 minutes.

For frontend development with the Spring Boot API running on port 8080, start
Vite from the `frontend` directory. The Vite development server proxies `/api`
requests to Spring Boot:

```sh
npm ci
npm run dev
```

With Vite running, use `http://localhost:5173/` to access the React UI; API
requests are proxied to the Spring Boot backend on port 8080.
