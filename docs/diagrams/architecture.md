```mermaid
flowchart LR
  UI[Client] --> API[Recommendation API]
  API --> CACHE[Redis Cache]

  API --> CAND[Candidate Generator]
  API --> RANK[Ranking Service]

  CAND --> REDIS[Feature Store Redis]
  RANK --> REDIS

  UI --> EVT[Event Collector]
  EVT --> KAFKA[Kafka]

  KAFKA --> DB[(PostgreSQL)]
  KAFKA --> TRAIN[Offline Training]

  TRAIN --> MODEL[Model Registry]
  MODEL --> RANK