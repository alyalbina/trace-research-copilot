import type { Workspace, Insight } from "./types";
import { emptyWorkspace } from "./types";
import { segmentTranscript } from "./ingestion";
const interviews = [
  {
    id: "p01",
    segment: "Abandoned onboarding",
    title: "The silence after submission",
    date: "2026-10-02",
    answers: [
      "I use a regular bank and wanted this account for travel. The first few screens were familiar, although I did not know whether I would need my passport or just my driving licence. I started on the bus and planned to finish before I got home.",
      "After I uploaded my ID, the screen just said pending. I could not tell if it was five minutes or five days. I kept reopening the app because I thought I had missed a button. Eventually I stopped checking.",
      "The photo itself was fine. I have done that with my bank before. It was the lack of a receipt that bothered me. Had they actually received the document? I did not want to send it twice and create another problem.",
      "I looked for a support address, but the help page only explained how to take a clear picture. I wanted to ask someone whether my application was in the queue. There was no obvious route from that page to a person.",
      "I am calling it abandoned, but I might return. If they had told me they were reviewing it and roughly when I would hear back, I would have put the phone down and waited. A moving spinner would not have solved that.",
      "I cannot say the company was unsafe. I had no evidence of that. It just felt unfinished, and I already had an account that worked. I would want a reliable update before putting money in.",
    ],
  },
  {
    id: "p02",
    segment: "Completed onboarding",
    title: "A clear path through verification",
    date: "2026-10-03",
    answers: [
      "I have used two digital banks. I opened this account for a shared holiday budget, so I had a specific reason to finish. I had my passport with me and was at home with decent lighting.",
      "I did not need more progress information. The confirmation email told me what would happen next, and that was enough. I was not watching the app while they checked it.",
      "They asked for a selfie after the document photo. That was expected. I would rather see a few checks than an account that anyone could open in my name. Too much explanation at every step might slow me down.",
      "The fee wording was harder than the identity check. I could not immediately tell if the travel benefit required the paid plan. I found the comparison page later, but it interrupted the reason I was signing up.",
      "I read the first paragraph about data, not the entire policy. The recognised security logo reassured me, though I could not tell you what it certifies. I tend to check the company name separately if I am unsure.",
      "I finished that evening. I would not use my experience to predict what happens if the photo fails. Mine worked the first time, and that probably changes how much guidance you need.",
    ],
  },
  {
    id: "p03",
    segment: "Verification issues",
    title: "Three photos, no useful explanation",
    date: "2026-10-03",
    answers: [
      "I was trying to get a small freelance payment into a separate account. I have used online banking for years, but this was my first time opening an account entirely on a phone.",
      "It rejected my document three times with the same message. I did not know what to change. I moved closer to the window, cleaned the camera and then tried a different room. I was guessing.",
      "The edges were inside the frame, so I assumed glare was the problem. That is my interpretation; the app never said glare. A friend suggested using a darker table, and the fourth photo went through.",
      "I nearly asked my client to pay into my personal account instead. The retry cost was not just the extra taps. I worried that repeated failures might lock me out, which I have seen happen on another service.",
      "If the screen could point to the part that was unreadable, I would try again. I do not want a generic video every time. Let me fix the actual problem and keep the information I already typed.",
      "It was approved the next morning. Once I could see the account, the experience was okay. I still do not know whether the darker table helped or whether the system was having a temporary issue.",
    ],
  },
  {
    id: "p04",
    segment: "First-time fintech",
    title: "Learning the rules while signing up",
    date: "2026-10-04",
    answers: [
      "My sister recommended the app. Until now I used the bank branch for anything unusual. I wanted to try sending money abroad, but I was not confident about which documents a phone app should ask for.",
      "Before sending my passport, I wanted to know who could see it and when it would be deleted. The policy was long, and I could not connect it to the photo I was about to take.",
      "I did not refuse to share it. I paused and asked my sister if this was normal. She said it was, which helped more than the text on the screen. A short answer beside the camera would have helped me decide myself.",
      "The word verification sounded like I had done something wrong. I expected a test or a call. When I understood it was checking that the account belonged to me, I was more comfortable.",
      "I finished the next day with her sitting next to me. The steps were not very long. I would not say the number of steps was the problem; it was not knowing why they were asking.",
      "I have not transferred money yet. Opening the account and trusting it with my savings are different decisions. I would try a small payment first, even if the sign-up screens were excellent.",
    ],
  },
  {
    id: "p05",
    segment: "Abandoned onboarding",
    title: "Interrupted, then back at the beginning",
    date: "2026-10-05",
    answers: [
      "I wanted to compare the budgeting features with the app I already use. It was an experiment rather than something urgent. I began registering during lunch and had to answer a work call.",
      "When I came back, I had to enter my address again. I had assumed the app saved it. I was not certain whether I had gone backwards or started a second application.",
      "I put the phone away because lunch was over. If I had been expecting a payment, I would probably have typed it again. For an optional account, repeating the boring part was enough to postpone it.",
      "A continue button that showed where I left off would help. I would still want sensitive information protected on a shared phone. Saving everything without telling me is not automatically better.",
      "I did not get as far as uploading identity documents, so I cannot comment on that part. I saw people discussing long waits online, but that was not why I left.",
      "I have not deleted the app. Sometimes I say a process is too long when I mean I am not convinced I need the product yet. Both might have mattered here.",
    ],
  },
  {
    id: "p06",
    segment: "Experienced digital banking",
    title: "Checks can build confidence",
    date: "2026-10-06",
    answers: [
      "I regularly switch accounts for better travel rates. I was comparing this one with a service I have used for several years. I had no urgent deadline and knew identification would be part of it.",
      "The verification checks made me trust the service more. I would have been suspicious if it only needed an email address. I did not mind waiting until the next day.",
      "There was a confirmation email, so I knew it had started. A countdown would have been strange because they cannot promise the same time for every case. I prefer an honest range to a precise number they miss.",
      "I do wish the account limits were clearer before I signed up. I only found the free-plan withdrawal limit after completing verification. The process worked; the proposition was less clear.",
      "I skimmed the privacy policy because I had already checked the company. A short explanation is useful for new customers, but I would want to be able to skip it. Do not make every experienced user read a tutorial.",
      "I opened the account, though I have not moved all my spending. A successful registration is not the same thing as choosing it as my main bank.",
    ],
  },
  {
    id: "p07",
    segment: "Privacy-conscious",
    title: "A decision at the document screen",
    date: "2026-10-07",
    answers: [
      "I had a previous account at another company affected by a data breach. That made me cautious about uploading identity documents. I wanted a spending account that I could keep separate from my main bank.",
      "The document screen did not explain how long they keep the image. I closed it to look that up. I found a general retention statement but no simple answer about this particular upload.",
      "I am not asking them to ignore financial rules. They may have to keep some records. I want to understand the difference between retaining the verification result and retaining an image of my passport.",
      "A badge saying secure would not answer my question. I would like a short summary linked to the actual policy. If they cannot give a deletion date, they should explain the condition that decides it.",
      "I abandoned it that afternoon. I might have left even with better wording because I am unusually cautious. That is a limitation of using my experience to decide what everyone needs.",
      "I did not contact support because I thought I would get a generic answer. That expectation came from another company, not from a bad response by this one.",
    ],
  },
  {
    id: "p08",
    segment: "Verification issues",
    title: "An identity check with no fallback",
    date: "2026-10-08",
    answers: [
      "I work shifts and tried registering after midnight. I had my ID, but the room was dim. I wanted to receive a reimbursement, so finishing mattered more than it would for a casual trial.",
      "The selfie kept failing, and there was no alternative I could find. I do not know if the lighting or my glasses caused it. Removing the glasses did not fix it.",
      "The help page told me to face the camera, which I was doing. I wanted either a specific reason or another way to verify. I did not want to keep sending almost the same picture.",
      "I searched the support pages and sent a message through the general form. They replied two days later asking me to try again. That might be reasonable for a non-urgent account, but it did not help with my reimbursement.",
      "I completed it in daylight on the weekend. I would call that a workaround, not a solution. Not everyone can do a video check during ordinary office hours.",
      "I cannot tell whether a human review would have been faster. I would like the option, with an honest waiting time, especially after several failed attempts.",
    ],
  },
  {
    id: "p09",
    segment: "Completed onboarding",
    title: "A brief wait that felt acceptable",
    date: "2026-10-09",
    answers: [
      "I opened the app after seeing a recommendation from a colleague. I use my existing bank every day, and I wanted to see whether the spending categories were easier to read here.",
      "I saw the pending screen, but I was happy to wait. I had other things to do. It did not make me think the app had failed, because the screen said they would email me.",
      "The notification arrived later that day. I cannot remember the exact number of hours. A notification was more useful than checking a progress bar, and I did not need an exact deadline.",
      "I was surprised by the selfie request but not upset. I had only prepared my driving licence. A list of what I would need at the start would have made it easier to choose a good moment.",
      "The first screen after approval was a little empty. I wanted to know whether to add money or connect another account. I had finished registration but still had to work out the first useful action.",
      "I tried a small transfer. I did not make this my main account. I would need to see how the budgeting features worked over several weeks before deciding that.",
    ],
  },
  {
    id: "p10",
    segment: "First-time fintech",
    title: "Knowing what to have ready",
    date: "2026-10-10",
    answers: [
      "I mostly use cash and my salary account. I wanted this app for a planned trip. I started at a café because I thought I only needed my phone number and email.",
      "I did not have my passport with me. A short checklist before starting would have saved the trip back home. I would also have liked to know that the selfie needed reasonable lighting.",
      "When I returned that evening, my details were still there. That helped. I did not worry about the wait for approval because the trip was a month away.",
      "I read the explanation about checking identity and found it reassuring. I was more concerned about making a mistake in my address than about the company holding the photo.",
      "The fee comparison was confusing, but I asked my colleague rather than checking every footnote. I may have selected the free plan simply because I was afraid of committing to a subscription.",
      "I completed it. A checklist would make the start easier for me, but I do not know whether it would change anyone else deciding to leave.",
    ],
  },
  {
    id: "p11",
    segment: "Abandoned onboarding",
    title: "Waiting without knowing the next move",
    date: "2026-10-11",
    answers: [
      "I needed an account for a sale on a marketplace. I had been told digital accounts were quick, so I expected to finish before sending the buyer my payment details.",
      "It said under review, but there was no explanation of what I could do next. I wondered if I should upload a different document. I could not find an estimate or a way to check the application.",
      "I tried going back to the camera screen. It seemed possible to start the upload again, but I did not want to reset the review. I decided to use the account I already had for the sale.",
      "The approval email came the following afternoon. I had already completed the sale. So I did not abandon because they eventually rejected me; the waiting process did not fit my immediate need.",
      "An honest warning before I started would have helped me plan. Showing that a document was received and saying there was nothing else to do would have reduced the uncertainty.",
      "I still might have used another account if the wait was unavoidable. Better information would help, but it cannot remove every reason for leaving.",
    ],
  },
  {
    id: "p12",
    segment: "Privacy-conscious",
    title: "A small detail with a big reading cost",
    date: "2026-10-12",
    answers: [
      "I opened an account to separate online purchases from my main spending. I am comfortable with digital banking but enlarge text on my phone because small grey labels are hard to read.",
      "I had to zoom in to read the consent text beside the checkbox. That made it harder to check what I was agreeing to. I would not call it a privacy refusal; it was a reading problem.",
      "I finished after switching to landscape. I do not know whether the app officially supports that. The document camera itself was fine, and I was not worried about waiting for the review.",
      "A short data explanation would be useful, but first I need to be able to read the existing text. A more detailed policy in the same tiny type would make it worse.",
      "I use larger text in other apps without trouble. I would like this app to respect that setting. I did not contact support, so they probably would not see the issue from tickets alone.",
      "I completed registration, but I was slower than I expected. Mine is one experience. It should prompt an accessibility check rather than a conclusion about how common the problem is.",
    ],
  },
];
const themeDefs = [
  [
    "t-verification",
    "Verification uncertainty",
    "Waiting becomes harder when receipt, timing, and next steps are unclear.",
  ],
  [
    "t-recovery",
    "Recovering from failed checks",
    "Generic errors leave participants guessing how to fix their submission.",
  ],
  [
    "t-privacy",
    "Trust & data consent",
    "Some participants need a specific explanation before sharing identity documents.",
  ],
  [
    "t-continuity",
    "Onboarding continuity",
    "Interruptions and missing preparation can break the registration flow.",
  ],
  [
    "t-value",
    "Value before commitment",
    "Account benefits and plan limits remain unclear for some participants.",
  ],
  [
    "t-access",
    "Accessible consent",
    "One participant had difficulty reading consent text with enlarged phone settings.",
  ],
];
const findings: [string, string, string, string, string][] = [
  [
    "i-uncertain",
    "t-verification",
    "Users feel uncertain about identity verification.",
    "Two participants described uncertainty after submitting documents: whether the upload was received, how long review might take, and whether further action was needed. A third worried about the consequences of repeated failed checks. Two others were comfortable waiting when email confirmation established the next step. Actionable communication may help, but urgency and different verification states remain alternative explanations.",
    "Evidence is drawn from five synthetic interviews. Urgency, prior experience and confirmation emails differ across accounts. Information alone would not remove a genuinely long wait.",
  ],
  [
    "i-recovery",
    "t-recovery",
    "Failed checks offer too little guidance to recover.",
    "Two participants described repeated document or selfie failures without a specific corrective instruction. They used daylight or a different background as workarounds, but neither could confirm the cause of failure. A recoverable error should identify the next useful action and offer a fallback after repeated attempts.",
    "Two synthetic cases; the actual failure cause is unknown. Do not label glare, glasses or a model defect as established causes.",
  ],
  [
    "i-privacy",
    "t-privacy",
    "Data consent needs answers at the moment of upload.",
    "Two participants looked for a concrete explanation of who sees the document and how long the image is retained. One first-time user sought reassurance from a family member; another paused registration. An experienced user skimmed the policy, showing that the same amount of explanation is unlikely to suit everyone.",
    "The privacy-conscious participant explicitly described unusual caution. Security badges and short copy cannot establish actual safety or compliance.",
  ],
  [
    "i-continuity",
    "t-continuity",
    "A clear way back can reduce the cost of interruption.",
    "One participant repeated address entry after a call and postponed registration. Another returned later and found their details retained. The discrepancy merits checking how session recovery behaves, rather than assuming the entire product always loses progress.",
    "Two conflicting synthetic accounts. Different app versions, sessions or device settings may explain the difference; none is verified.",
  ],
  [
    "i-ready",
    "t-continuity",
    "A preparation checklist could help first-time customers.",
    "One first-time participant started without their passport. Another completed customer was surprised by the selfie requirement. A brief list of required documents and camera conditions may help people choose an appropriate moment to begin.",
    "Two synthetic accounts. The checklist is a product hypothesis; no effect on completion has been measured.",
  ],
  [
    "i-value",
    "t-value",
    "Plan limits interrupt the reason for signing up.",
    "Two experienced participants described uncertainty about paid-plan benefits or free-plan withdrawal limits. They still completed onboarding. This suggests a communication opportunity, without evidence that fee wording caused abandonment in these interviews.",
    "Two synthetic interviews, both completed. No supported causal claim about drop-off.",
  ],
  [
    "i-access",
    "t-access",
    "Consent text needs an accessibility review.",
    "One participant enlarged phone text and switched orientation to read the consent label. They described a reading problem, not a refusal to share data. This minority finding warrants testing with assistive settings and representative users.",
    "One synthetic account. No prevalence or accessibility conformance conclusion can be drawn from it.",
  ],
];
// Manually annotated participant answer indices; these are precomputed demo labels, never a live model response.
const annotations: [
  string,
  number,
  string,
  string,
  "supporting" | "contradictory",
][] = [
  ["p01", 1, "i-uncertain", "Pain point", "supporting"],
  ["p11", 1, "i-uncertain", "Pain point", "supporting"],
  ["p03", 3, "i-uncertain", "Pain point", "supporting"],
  ["p02", 1, "i-uncertain", "Observation", "contradictory"],
  ["p09", 1, "i-uncertain", "Observation", "contradictory"],
  ["p03", 1, "i-recovery", "Pain point", "supporting"],
  ["p08", 1, "i-recovery", "Pain point", "supporting"],
  ["p08", 4, "i-recovery", "Workaround", "supporting"],
  ["p04", 1, "i-privacy", "Need", "supporting"],
  ["p07", 1, "i-privacy", "Need", "supporting"],
  ["p06", 4, "i-privacy", "Observation", "contradictory"],
  ["p05", 1, "i-continuity", "Pain point", "supporting"],
  ["p10", 2, "i-continuity", "Observation", "contradictory"],
  ["p10", 1, "i-ready", "Need", "supporting"],
  ["p09", 3, "i-ready", "Need", "supporting"],
  ["p02", 3, "i-value", "Pain point", "supporting"],
  ["p06", 3, "i-value", "Pain point", "supporting"],
  ["p12", 1, "i-access", "Pain point", "supporting"],
];
export function makeSeed(): Workspace {
  const w: Workspace = structuredClone(emptyWorkspace);
  const projectId = "fintech-onboarding";
  const now = "2026-10-12T15:00:00.000Z";
  w.projects.push({
    id: projectId,
    name: "Fintech Onboarding",
    objective:
      "Understand why new users drop off during registration and identity verification, and where the experience can earn their confidence.",
    questions:
      "Why do users abandon registration?\nWhat causes uncertainty during identity verification?\nWhat builds or weakens trust?\nWhich steps create unnecessary friction?\nWhat might support first-time activation?",
    context:
      "A synthetic digital financial platform offering spending accounts, travel payments and budgeting tools.",
    methodology:
      "12 synthetic semi-structured interviews, authored for demonstration. Purposive variation in experience and outcomes; no real participants or field research.",
    criteria:
      "New customers with completed or abandoned registration, first-time fintech customers, experienced digital banking users, people encountering verification issues and privacy concerns.",
    status: "Active",
    createdAt: "2026-10-01T09:00:00.000Z",
  });
  const prompts = [
    "What brought you to the product, and where did you start?",
    "Tell me about the point that stood out to you.",
    "What happened next, and how did you interpret it?",
    "What did you try, or what would have helped?",
    "How did the process end for you?",
    "What should we be careful not to assume from your experience?",
  ];
  for (const p of interviews) {
    const id = "int-" + p.id;
    const transcript = p.answers
      .map((a, n) => `Researcher: ${prompts[n]}\n${p.id.toUpperCase()}: ${a}`)
      .join("\n\n");
    w.participants.push({
      id: p.id,
      identifier: p.id.toUpperCase(),
      segment: p.segment,
    });
    w.interviews.push({
      id,
      projectId,
      participantId: p.id,
      title: p.title,
      date: p.date,
      tags:
        p.segment === "Verification issues"
          ? "verification, recovery"
          : "onboarding",
      objective: w.projects[0].objective,
      notes:
        "Synthetic transcript. Participant identifiers are fictional. No timestamps or durations were inferred.",
      transcript,
      synthetic: 1,
      analysisStatus: "Demo analyzed",
      createdAt: p.date + "T10:00:00.000Z",
    });
    w.segments.push(...segmentTranscript(transcript, id));
  }
  for (const [id, title, explanation] of themeDefs)
    w.themes.push({
      id,
      projectId,
      title,
      explanation,
      status: "Under Review",
    });
  for (const [id, themeId, title, explanation, limitations] of findings)
    w.insights.push({
      id,
      projectId,
      themeId,
      title,
      explanation,
      limitations,
      status: ["i-ready", "i-value"].includes(id) ? "Verified" : "Under Review",
      provenance: "Precomputed synthetic demo",
      createdAt: now,
    } as Insight);
  annotations.forEach(([p, n, i, kind, role], idx) => {
    const insight = w.insights.find((x) => x.id === i)!;
    const s = w.segments.filter((s) => s.interviewId === "int-" + p)[n * 2 + 1];
    const id = "ev-" + String(idx + 1).padStart(2, "0");
    w.evidence.push({
      id,
      segmentId: s.id,
      quote: s.text,
      kind,
      themeId: insight.themeId,
      provenance: "Precomputed synthetic demo",
      createdAt: now,
    });
    w.insightLinks.push({ insightId: i, evidenceId: id, role });
    w.evaluationCases.push({
      id: "eval-" + idx,
      segmentId: s.id,
      expectedKind: kind,
      themeTitle: w.themes.find((t) => t.id === insight.themeId)!.title,
      relevant: 1,
    });
  });
  // Two negative examples check that interviewer prompts are not treated as participant evidence.
  for (const p of ["p01", "p07"])
    w.evaluationCases.push({
      id: "negative-" + p,
      segmentId: "int-" + p + "-s1",
      expectedKind: "None",
      themeTitle: "None",
      relevant: 0,
    });
  const defs = [
    [
      "op-ready",
      "Show what to have ready",
      "i-ready",
      "A preparation checklist may help customers choose a good time to begin.",
      "Discovery",
    ],
    [
      "op-value",
      "Explain plan limits before commitment",
      "i-value",
      "Showing relevant free and paid limits may reduce confusion about the account proposition.",
      "Discovery",
    ],
  ];
  for (const [id, title, insightId, hypothesis, status] of defs) {
    w.opportunities.push({
      id,
      projectId,
      title,
      problem: w.insights.find((i) => i.id === insightId)!.explanation,
      hypothesis,
      direction: "Test a concise, contextual explanation in a prototype.",
      segment: "First-time and experienced customers",
      assumptions:
        "Information is the barrier rather than low motivation or an unsuitable offer.",
      outcome: "Customers can make an informed next-step decision.",
      risk: "Extra explanation may delay experienced customers.",
      impact: 3,
      confidence: 2,
      effort: 2,
      status,
      metric:
        "Proposed: task completion and comprehension in a moderated prototype test. No result measured.",
      validation:
        "Moderated prototype study with five representative participants; probe comprehension and seek disconfirming feedback.",
      createdAt: now,
    });
    w.opportunityLinks.push({ opportunityId: id, insightId });
  }
  w.runs.push({
    id: "demo-run",
    projectId,
    mode: "Precomputed synthetic demo",
    status: "Completed",
    detail:
      "12 synthetic transcripts; manually curated findings. No external model request was made.",
    createdAt: now,
  });
  for (const i of ["i-ready", "i-value"])
    w.reviews.push({
      id: "seed-review-" + i,
      entityId: i,
      action: "Verified",
      note: "Seeded demonstration review state; not a real researcher event.",
      createdAt: now,
    });
  return w;
}
