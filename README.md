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

PR fix generation and pushes are disabled by default. To enable them for local
use, set a GitHub token with access to read pull requests and read/write
contents in the pull request's head repository. For a fine-grained personal
access token, grant **Contents: Read and write** on the target repository.
The token must be allowed to push to the PR's head branch; public visibility
does not grant anonymous write access. Restart Spring Boot after setting
either value:

```sh
export GITHUB_TOKEN=your-github-token
export GITHUB_WRITE_ENABLED=true
./backend/mvnw -f backend/pom.xml spring-boot:run
```

The app binds to `127.0.0.1` by default. Keep it local when write access is
enabled; this workflow does not provide user authentication for shared or
deployed access. After a review, select findings to fix, inspect the proposed
diff, and explicitly confirm the push. The commit is added to the PR's head
branch. Only open PRs are supported, and each preview expires after 10 minutes.

For frontend development with the Spring Boot API running on port 8080, start
Vite from the `frontend` directory. The Vite development server proxies `/api`
requests to Spring Boot:

```sh
npm ci
npm run dev
```
