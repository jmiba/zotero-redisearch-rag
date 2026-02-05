# Retrieval and Ranking

This section explains how the plugin finds relevant chunks and orders them before an answer is generated.

## Vector + lexical retrieval (and RRF fusion)
The plugin uses two kinds of search:

- **Vector search**: finds chunks with similar meaning.
- **Lexical search**: finds chunks that share important words.

Results from both are combined using **RRF (Reciprocal Rank Fusion)**, which balances semantic and keyword matches.

## Retrieval fallback (auto‑broadening)
If the first search looks weak (too few chunks, too little text, or weak scores), the plugin automatically broadens the search and tries again with more candidates.

## Optional query expansion
You can enable **query expansion** to generate a few alternative queries for short or ambiguous questions. This can improve recall when the exact wording isn’t present in the PDFs.

## Optional cross‑encoder reranking
You can enable a **cross‑encoder reranker** to re‑score the candidate chunks with a more precise model. This is slower but can improve ranking quality.

## Tag boosting and max‑per‑doc caps
- **Tag boosting** can promote chunks whose tags match your query keywords.
- **Max‑per‑doc** limits how many chunks from the same document appear in the final set, so one PDF doesn’t dominate the answer.

## Annotation chunk retrieval
Annotations can be retrieved alongside normal chunks. This lets highlights and notes influence the final answer when they are relevant.
