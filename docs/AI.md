# AI in SharedSpace

## Goal

AI should reduce administrative work and make existing workspace knowledge easier to use.

It should not replace explicit decisions, permissions, or authoritative records.

## Candidate features

### Document assistance

- Summaries
- Question answering over permitted documents
- Extract important dates/actions
- Draft metadata/categories

### Meetings

- Draft agenda from open cases/tasks
- Summarize notes
- Draft minutes
- Extract proposed decisions
- Extract follow-up tasks

### Workspace assistant

Examples:

- "What did we decide about replacing the roof?"
- "Which maintenance tasks are overdue?"
- "Summarize expenses related to the boat engine this year."
- "When is the cabin available next month?"

### Writing assistance

- Draft notices
- Draft meeting invitations
- Improve decision text
- Summarize long updates

## Trust model

AI output is generated content and may be wrong.

Consequential actions should normally require explicit confirmation before changing authoritative records.

Examples:

- Creating a final decision
- Sending messages externally
- Changing permissions
- Recording financial information
- Deleting data

## Retrieval and permissions

AI retrieval must apply permissions before content is supplied to the model.

A model must never receive documents/data that the requesting user could not otherwise access.

Workspace boundaries must also apply to embeddings, indexes, caches, traces, and evaluation datasets.

## Provider abstraction

Do not make product/domain code depend directly on a single model vendor. Maintain a small AI service boundary that can route tasks to appropriate models/providers.

Avoid building an elaborate multi-provider abstraction before a second provider or concrete portability requirement exists.

## Cost control

Track AI usage by workspace and feature. Use smaller/cheaper models for tasks that do not need frontier reasoning. Cache safe deterministic-ish derived artifacts such as document summaries when appropriate.

## Privacy

Before production use, evaluate:

- Provider retention policies
- Training/data usage policies
- DPA availability
- Data residency
- Sensitive data handling
- User disclosure/consent needs

## Future architecture

Potential components:

- Document extraction pipeline
- Chunking/indexing
- Permission-aware semantic retrieval
- Model gateway/service
- Usage accounting
- Prompt/version management
- Evaluation suite
- Human confirmation workflows

These should be introduced incrementally as real AI features are built.
