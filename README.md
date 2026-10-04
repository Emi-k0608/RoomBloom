# RoomBloom

RoomBloom is a cooperative web prototype for shared-house chores. Housemates complete daily chores to earn shared points, then use those points to unlock room rewards and help their virtual pet, Mochi the beaver, grow.

## Current prototype

- One demo room with three chores: take out the trash, wash dishes, and vacuum.
- Each chore can be completed once per day and awards shared points.
- Rewards include a colorful rug and Big Beaver.
- The frontend loads room state from the backend and receives updates through Server-Sent Events (SSE).
- Room state is held in memory and resets when the backend restarts.
- The demo does not yet include accounts, room creation, or persistent storage.

Reward costs are currently defined in the backend reward enum. The frontend also uses those costs to render its cards, so update both sides if a reward cost changes.

## Technology

- Java 25
- Spring Boot
- HTML, CSS, and JavaScript
- Server-Sent Events (SSE)

## Project structure

```text
backend/
├── src/main/java/com/homepets/backend/
│   ├── BackendApplication.java  # Spring Boot entry point
│   ├── controller/              # REST endpoints and SSE subscription
│   ├── service/                 # Demo room state and application rules
│   ├── model/                   # Room, pet, chore, and reward models
│   └── dto/                     # API response data
└── src/main/resources/
    ├── application.properties   # Spring Boot configuration
    └── static/
        ├── assets/              # Images, icons, and fonts
        ├── app.js               # API integration and UI behavior
        ├── index.html
        └── styles.css
```

## Requirements

- JDK 25
- IntelliJ IDEA with Gradle support

The Gradle Wrapper is included in `backend/`; a separate Gradle installation is not required.

## Open the project in IntelliJ IDEA

1. Open the repository folder in IntelliJ IDEA.
2. If prompted, import or link the Gradle project at `backend/build.gradle`.
3. In **File > Project Structure**, select a JDK 25 installation for the Project SDK.
4. In **Settings > Build, Execution, Deployment > Build Tools > Gradle**, select the JDK 25 installation as the Gradle JVM.
5. Wait for Gradle sync to finish.

## Run the application

In IntelliJ IDEA, open the Gradle tool window, expand the `backend` project, then run **Tasks > application > bootRun** (or **Tasks > bootRun**, depending on the Gradle tool window layout).

Alternatively, create an **Application** run configuration:

1. Set the main class to `com.homepets.backend.BackendApplication`.
2. Set the classpath module to the backend main module (usually `backend.main`).
3. Select JDK 25 as the runtime.
4. Run the configuration.

When the application starts, open <http://localhost:8080/>.

## Debug the application

Set breakpoints in the Java source, then start the `BackendApplication` run configuration with **Debug**. You can also debug frontend behavior using the browser's Developer Tools and inspect the Console, Network requests, and the `/subscribe` EventStream.

## API

All endpoints currently operate on the single demo room at `/api/rooms/demo`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/rooms/demo` | Get the current room snapshot. |
| `GET` | `/api/rooms/demo/subscribe` | Subscribe to `room-update` events using SSE. The current snapshot is sent on connection, followed by updates after changes. |
| `POST` | `/api/rooms/demo/chores/{choreId}/complete` | Complete a chore, if available, and earn its points. |
| `POST` | `/api/rooms/demo/rewards/{rewardId}/unlock` | Unlock a reward if the room has enough points. Current rewards are `rug` and `big-beaver`. |
| `POST` | `/api/rooms/demo/reset` | Reset the demo room to its initial state. |

The frontend sends actions through REST endpoints. The backend broadcasts updated room snapshots over SSE to connected clients.
