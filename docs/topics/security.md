# Security Topic

## ID

`security`

## Focus

- Software security, major CVEs, GitHub Security Advisories, NVD/CISA KEV updates, RustSec, npm/PyPI supply-chain incidents, open-source dependency risk, cloud security events, and AI agent/MCP security.
- Defensive, advisory, impact, mitigation, and ecosystem-risk information with clear identifiers or authoritative sources.
- One feed item describes one advisory, vulnerability, supply-chain event, mitigation update, policy change, incident disclosure, or defensive security signal.

## Kinds

- `breaking`: confirmed high-impact vulnerability, exploit-in-the-wild advisory, supply-chain compromise, or urgent mitigation update.
- `policy_update`: advisory, regulator, standards, platform policy, coordinated disclosure, KEV entry, or ecosystem security rule.
- `data`: affected versions, dependency graph, advisory matrix, timeline, mitigation structure, or exposure map.
- `insight`: source-backed context around one security event or ecosystem risk.
- `news` / `hot_topic`: default verified security update or high-attention bounded security event.

## Title / Event Key

- Title identifies the CVE, advisory, package, project, platform, vendor, affected ecosystem, or security event.
- `eventKey` combines advisory identifier or project/package, event type, and CVE/advisory/version/date when available.

## Sources

Priority:

- Primary: GitHub Security Advisory.
- Secondary: CISA KEV, NVD, or official vendor advisories.
- Reference: X or Reddit for security-community attention and discussion context only.

If CVE identifier, affected version, exploit status, mitigation, patch availability, package name, or vendor status cannot be confirmed by Primary or Secondary sources, skip the item.

## Poster Prompt

```text
Use a serious cybersecurity and software-supply-chain editorial cover style.

Show one clear security subject: vulnerability disclosure, security advisory, dependency risk, supply-chain incident, cloud security issue, open-source package risk, patch release, policy update, or coordinated response.

Use a restrained technical visual language with dark slate, blue, cyan, white, and controlled warning accents.
Prefer security operations rooms, code review desks, dependency graphs, advisory documents, package registries, cloud infrastructure, patch pipelines, access-control diagrams, or risk dashboards.

For breaking, show urgent but restrained confirmed security news without panic or exploit imagery.
For policy_update, show advisory review, compliance workflow, standards, governance, or coordinated disclosure context.
For data, show symbolic dependency graphs, affected-version matrices, patch timelines, package ecosystem maps, or risk dashboards.
For insight, show cause-and-effect paths between vulnerability, affected software, dependency chain, mitigation, and patch status.
For hot_topic or news, focus on one confirmed advisory, package, project, cloud service, vendor, or ecosystem event.

Use verified CVE IDs, advisory IDs, project names, package names, affected versions, patch versions, vendor names, dates, and severity labels only when supplied by the feed.

Avoid exploit instructions, attack walkthroughs, malware visuals, fake terminal commands, fake CVE IDs, fake severity scores, fake package names, copied logos, sensational hacker imagery, panic visuals, and unsupported readable text.
```

## Skip

- Content would provide actionable attack steps or exploit instructions.
- Vulnerability lacks a reliable advisory, affected version, maintainer notice, or credible confirmation.
- Severity, exploit status, or mitigation is not supported by the source.
- Equivalent advisory, patch, incident, or mitigation update already exists.
