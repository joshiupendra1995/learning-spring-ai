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

For frontend development with the Spring Boot API running on port 8080, start
Vite from the `frontend` directory. The Vite development server proxies `/api`
requests to Spring Boot:

```sh
npm ci
npm run dev
```
