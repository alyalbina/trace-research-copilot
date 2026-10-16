# Evaluation and event definitions

## Reproducible commands

```sh
npm test
npm run evaluate
npm run typecheck
npm run test:e2e
```

The unit/integration suite uses real in-memory SQLite with the production migration and domain commands. It includes deliberate quote corruption, missing segments, cross-project linking, duplicate ingestion, archived-project protection and the import-to-report workflow.

The evaluation command checks the seeded reference corpus. The UI computes the same metrics against current database records. Changing research data may therefore change the UI results without changing the seed evaluation.

## Metrics

| Metric | Numerator | Denominator | Limit |
|---|---|---|---|
| Citation validity | Evidence items with a resolving segment | All evidence items | Existence alone does not prove support |
| Quote exactness | Evidence items literally matching their segment | All evidence items | Does not assess context or interpretation |
| Annotated precision | Candidates matching a relevant reference segment and classification | Extracted candidates on annotated segments | Excludes unannotated segments |
| Annotated recall | Relevant reference segment/class pairs present | All relevant reference pairs | Segment-level, not concept-level recall |
| Theme agreement | Correct annotated candidates matching the reference theme title | Correct annotated candidates | A narrow classification agreement proxy |
| Unsupported source rate | Insights without any exact supporting excerpt | All insights | Not a semantic hallucination rate |
| Review acceptance | Verified review actions | Verified, Edited, Rejected and Under Review actions | Repeated actions and seeded states are included |

Zero denominators display N/A. Negative reference cases check that researcher prompts are not extracted as customer evidence. The application exposes each reference case and its original passage.

The seed reference classifications also generate the precomputed demonstration findings. Perfect consistency in this dataset is expected and **is not an independent holdout result**. No live extraction model, real customer dataset, independent annotator agreement study, product uplift or production quality result is claimed.

## Lightweight event tracking

Important actions are appended to `reviews` with entity ID, action, note and UTC time. These records support inspection and future measurement. They are stored locally or in the private database, not an external analytics service.

| Event/action | Trigger | Potential product measure |
|---|---|---|
| Interview imported | An import batch commits | Start point for import-to-review time |
| Evidence saved | A source-exact excerpt commits | Evidence collection activity |
| Insight created | A new sourced interpretation commits | First finding availability |
| Edited | An interpretation changes | Researcher correction activity |
| Verified / Rejected / Under Review | A review action commits | Review decisions and acceptance actions |
| Opportunity created | A hypothesis and optional verified links commit | Research-to-opportunity conversion |
| Report generated / Report edited | A report draft commits | Report drafting activity |
| Source validation | A local validation run commits | Integrity check activity |

Time to first reviewed insight and opportunity-from-verified-insight conversion can be derived from these records, but are not presented as measured product success. Report download completion and time spent reading are not instrumented. The synthetic workspace activity includes clearly labeled seeded review states; it must not be used as customer usage evidence.
