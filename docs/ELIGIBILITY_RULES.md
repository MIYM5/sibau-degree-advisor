# Eligibility Rules

## Safety statement

SIBAU Degree Advisor is an independent project and is not an official Sukkur IBA admissions system. Eligibility results and recommendations provide guidance only and do not guarantee admission. Applicants must verify requirements in the current Sukkur IBA University admission advertisement and complete the official admissions process.

## Three rule categories

### Confirmed official eligibility

A narrow criterion supported by a current authoritative Sukkur IBA University source. The source must be stored with its URL, last-verified date, and applicable admission year when known.

### Working MVP eligibility rule

A project rule used for current behavior and testing. It must not be presented as official university policy.

### Recommendation-model assumption

A choice used to estimate academic, interest, aptitude, confidence, or ranking. It cannot create or remove official eligibility.

Any criterion based on an older source, a general page, incomplete wording, or conflicting evidence is **verification required against the current admission advertisement**.

## Working Pre-Medical eligibility rule

The MVP must implement the following rule exactly:

- Pre-Medical students are eligible for all Sukkur IBA undergraduate programs included in the knowledge base except:
  1. BE Electrical Engineering
  2. BE Computer Systems Engineering
- Pre-Medical students are eligible for BS Computer Science, BS Software Engineering, BS Artificial Intelligence, BS Mathematics, business programs, economics, accounting and finance, media and communication, education, physical education, and other non-engineering programs included in the knowledge base.
- Missing Mathematics may reduce academic suitability for some programs, but it must not automatically make a Pre-Medical student ineligible for any non-engineering program.
- BE Electrical Engineering and BE Computer Systems Engineering must use their separate restricted eligibility rules.

Classification: **working MVP eligibility rule**.

Before production launch, reconcile this rule with the active Sukkur IBA University admission advertisement for the relevant intake.

## Restricted engineering rules recorded in the workbook

These are separate from the general Pre-Medical rule and must be rechecked against the current admission advertisement before production use.

| Program | Workbook rule | Current classification |
| --- | --- | --- |
| BE Electrical Engineering | Pre-Engineering; Mathematics and Physics; 60% minimum subject threshold; 60% overall minimum. Pre-Medical is not eligible under the working rule. | Restricted rule recorded from an official admissions-procedure URL; current-advertisement verification required. |
| BE Computer Systems Engineering | Pre-Engineering or ICS; Mathematics and Physics/Computer Science; 60% minimum subject threshold; 60% overall minimum. Pre-Medical is not eligible under the working rule. | Restricted rule recorded from an official CSE eligibility URL; exact current wording and advertisement verification required. |

Do not broaden, narrow, or reinterpret these rules without source evidence and review.

## Program evidence registry from the knowledge base

The following URLs and dates are copied from the workbook's `Program_Master` sheet. Preserving them does not upgrade every note to confirmed official policy.

| Program | Source URL | Last verified | Evidence caution |
| --- | --- | --- | --- |
| Bachelor of Business Administration (BBA) | https://www.iba-suk.edu.pk/offered-programs/bba | 2026-07-17 | Workbook notes 50% Intermediate/F.Sc and no supplementary or condoned subject; verify against the current advertisement. |
| BBA (Agribusiness) | https://www.iba-suk.edu.pk/offered-programs/agri-business | 2026-07-17 | Workbook notes diverse backgrounds and 50%; recheck the current intake and joint-program arrangements. |
| BS Computer Science | https://www.iba-suk.edu.pk/offered-programs/computer-science | 2026-07-17 | The page supports program/general eligibility evidence; Pre-Medical treatment is the working MVP rule. |
| BS Software Engineering | https://www.iba-suk.edu.pk/offered-programs/software-engineering | 2026-07-17 | Pre-Medical treatment and missing-subject handling are working/model rules pending current-advertisement verification. |
| BS Artificial Intelligence | https://www.iba-suk.edu.pk/Content/pdf/announcements/BS%20AI%20Fall%202025%20Schema.pdf | 2026-07-17 | A Fall 2025 schema is not automatically the final 2026 eligibility authority. |
| BS Accounting & Finance | https://www.iba-suk.edu.pk/Content/pdf/BS%20AF%20Program%20PLOs-Eligibility.pdf | 2026-07-17 | Workbook applies a general 50% BS criterion; confirm the active advertisement. |
| BS Economics | https://www.iba-suk.edu.pk/Content/pdf/offered-programs/Course-schema-BS-Economics.pdf | 2026-07-17 | Program listing/schema evidence; final eligibility requires current-advertisement confirmation. |
| BS Mathematics | https://www.iba-suk.edu.pk/offered-programs/bs-mathematics | 2026-07-17 | Working MVP rule allows Pre-Medical, but another official source in the workbook says Pre-Engineering with 50%; conflict unresolved. |
| BS Media & Communication | https://www.iba-suk.edu.pk/offered-programs/bs-media-communication | 2026-07-17 | Workbook uses a general 50% BS minimum pending current-advertisement confirmation. |
| BS Physical Education & Sports Sciences | https://www.iba-suk.edu.pk/Content/pdf/home/SIBA-Student-Handbook-2020-21_Updated.pdf | 2026-07-17 | Older handbook; confirm current eligibility and whether the program is open. |
| Associate Degree in Physical Education & Sports Sciences | https://www.iba-suk.edu.pk/Content/pdf/home/SIBA-Student-Handbook-2020-21_Updated.pdf | 2026-07-17 | Older handbook; confirm current eligibility, availability, and MVP scope. |
| BE Electrical Engineering | https://www.iba-suk.edu.pk/admission/under-graduate-program/admission-procedures | 2026-07-17 | Restricted rule; verify thresholds and wording in the current advertisement. |
| BE Computer Systems Engineering | https://www.iba-suk.edu.pk/CSE/ElgCriteria | 2026-07-17 | Restricted rule; use exact current wording in production. |
| B.Ed (Hons) | https://www.iba-suk.edu.pk/Content/pdf/offered-programs/B.Ed%20%28Hons%29%20-%204%20YEARS%20-%20FOR%20WEBSITE.pdf | 2026-07-17 | Workbook notes general 50% criteria; confirm the active advertisement. |

## Additional official sources preserved from the workbook

| Topic | Source URL | What the workbook says it supports | Required caution |
| --- | --- | --- | --- |
| Current undergraduate program list | https://www.iba-suk.edu.pk/admissions/under-graduate-programs | Listed programs in the workbook. | The site may mix legacy and current items; compare with the active advertisement. |
| 2026 admission announcements | https://www.iba-suk.edu.pk/admissions/announcements | Undergraduate announcements are active for 2026. | Use the attached 2026 advertisement/eligibility PDF as final authority before launch. |
| Engineering and Mathematics general eligibility | https://nthp.iba-suk.edu.pk/Admission/EligibilityCriteria | Engineering: Pre-Engineering with 60%; BS Mathematics: Pre-Engineering with 50%; BA/BS/B.Ed: 50%. | Official NTHP source, but reconcile it with the main 2026 advertisement. |

The workbook also repeats the BBA, Agribusiness, BS Computer Science, BE Computer Systems Engineering, and Physical Education sources in its source-notes sheet; the exact URLs above are preserved.

## Known unresolved issues

1. **BS Mathematics conflict:** the working MVP rule makes Pre-Medical students eligible, while the official NTHP page recorded in the workbook says Pre-Engineering with 50%. Keep the MVP behavior as instructed, label it as working, and display verification required until the current advertisement resolves the conflict.
2. **General 50% rule:** several program rows use a general BS minimum rather than a program-specific current advertisement. Do not call these program-specific official criteria without verification.
3. **2026 final authority:** the workbook points to the 2026 announcements page but does not contain the final current advertisement PDF URL as a row-level source.
4. **Older documents:** Physical Education evidence uses a 2020–21 handbook, and BS Artificial Intelligence uses a Fall 2025 schema.
5. **Program availability:** confirm which programs and the associate degree are actually open in the target intake.
6. **Engineering wording:** verify whether thresholds apply to overall marks, named subjects, combinations, equivalence routes, or other conditions exactly as stated in the current advertisement.
7. **Supplementary/condoned subjects:** the workbook mentions restrictions for some general criteria; confirm current scope and wording before applying them across programs.

## Implementation rules

- Never infer a hard prerequisite from a nonzero suitability weight.
- Never treat a missing preferred subject as zero automatically.
- Never let score re-normalization bypass a required subject.
- Never rank Verification required as Eligible.
- Never hide source age or conflicts.
- Record the exact source and date whenever an eligibility rule changes.
