# Retrieval and Ranking

This section explains how the plugin finds relevant chunks and orders them before an answer is generated.

## Vector + lexical retrieval (and RRF fusion)
The plugin uses two kinds of search:

- **Vector search**: finds chunks with similar meaning.
- **Lexical search**: finds chunks that share important words.

Results from both are combined using **RRF (Reciprocal Rank Fusion)**, which balances semantic and keyword matches.

## Retrieval fallback (auto‑broadening)
If the first search looks weak (too few chunks, too little text, or weak scores), the plugin automatically broadens the search and tries again with more candidates.

## Optional chat-history query rewriting
You can enable **Rewrite follow-up queries** to normalize the current chat turn into a standalone retrieval query before search.

This is useful when your current question depends on earlier chat context, for example:

- pronoun-heavy follow-ups
- short refinement questions
- multilingual follow-ups that refer back to previous turns

The rewritten query is used only for retrieval. The answer prompt still uses your original wording, so the assistant responds to what you asked rather than to the rewritten form.

## Optional agentic RAG planner
You can enable **agentic retrieval** to run a lightweight planner step before answer generation.

Agentic mode chooses among three actions:

- **Keep context**: proceed with the current retrieved set.
- **Expansion retry**: run another retrieval pass with broader candidate generation.
- **Full-document pull**: fetch additional chunks from a selected document for whole-document synthesis questions.

Control loop depth with **Agentic max iterations** (caps planner steps per query).

Notes:

- Agentic mode runs on top of the same retrieval stack (vector + lexical + RRF).
- If query expansion and reranking are enabled, the planner can use them in retry passes.
- Agentic mode usually improves hard-query recall, but may increase latency and token usage.

## Optional query expansion
You can enable **query expansion** to generate a few alternative queries for short or ambiguous questions. This can improve recall when the exact wording isn’t present in the PDFs.

Query rewriting and query expansion are separate:

- **Query rewriting** resolves conversational context into one standalone retrieval query.
- **Query expansion** generates additional alternative retrieval variants from that query.

## Optional cross‑encoder reranking
You can enable a **cross‑encoder reranker** to re‑score the candidate chunks with a more precise model. This is slower but can improve ranking quality.

## Tag boosting and max‑per‑doc caps
- **Tag boosting** can promote chunks whose tags match your query keywords.
- **Max‑per‑doc** limits how many chunks from the same document appear in the final set, so one PDF doesn’t dominate the answer.

## Annotation chunk retrieval
Annotations can be retrieved alongside normal chunks. This lets highlights and notes influence the final answer when they are relevant.
