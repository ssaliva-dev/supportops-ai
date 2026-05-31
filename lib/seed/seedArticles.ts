import type { Article } from "@/types/domain";

export const seedArticles: Array<Omit<Article, "id" | "createdAt" | "updatedAt">> = [
  {
    title: "Refund Policy",
    sourceUrl: "https://docs.supportopsai.dev/billing/refunds",
    tags: ["billing", "refund", "policy"],
    body: [
      "Customers can request a full refund within 30 calendar days of the initial purchase date for monthly and annual self-serve plans.",
      "Refund requests submitted after 30 days are not eligible unless there is a duplicate charge or a confirmed billing system error.",
      "Refunds are returned to the original payment method within 5 to 10 business days after approval.",
      "Add-on usage fees are non-refundable once consumed.",
    ].join("\n\n"),
  },
  {
    title: "Annual Plan Cancellation",
    sourceUrl: "https://docs.supportopsai.dev/billing/annual-cancellation",
    tags: ["billing", "annual", "cancellation"],
    body: [
      "Annual plans can be canceled at any time from the billing settings page.",
      "Cancellation stops auto-renewal at the end of the current annual term.",
      "Annual plan fees are prepaid and are not prorated after the 30-day refund window.",
      "Workspace access and features remain active until the term end date.",
    ].join("\n\n"),
  },
  {
    title: "Enterprise SSO",
    sourceUrl: "https://docs.supportopsai.dev/security/enterprise-sso",
    tags: ["security", "enterprise", "sso", "saml"],
    body: [
      "SAML-based single sign-on is available on the Enterprise plan.",
      "Supported identity providers include Okta, Microsoft Entra ID, and Google Workspace.",
      "Just-in-time provisioning is supported when SAML attributes include email and name.",
      "SCIM provisioning is available as an add-on for Enterprise accounts.",
    ].join("\n\n"),
  },
  {
    title: "Data Retention",
    sourceUrl: "https://docs.supportopsai.dev/security/data-retention",
    tags: ["security", "retention", "compliance"],
    body: [
      "Ticket content and conversation logs are retained while the workspace is active.",
      "After account deletion, customer data is queued for deletion within 30 days.",
      "Encrypted backups may persist for up to 14 additional days before automatic purge.",
      "Enterprise customers can request a custom retention policy through support.",
    ].join("\n\n"),
  },
  {
    title: "Billing Failure Recovery",
    sourceUrl: "https://docs.supportopsai.dev/billing/payment-failures",
    tags: ["billing", "payment", "invoices"],
    body: [
      "If a renewal charge fails, the system retries payment up to 4 times over 7 days.",
      "During retry mode, workspace access remains active.",
      "If all retries fail, the workspace enters read-only mode until payment is resolved.",
      "Billing admins receive email notifications after each failed attempt.",
    ].join("\n\n"),
  },
  {
    title: "Password Reset",
    sourceUrl: "https://docs.supportopsai.dev/accounts/password-reset",
    tags: ["account", "password", "security"],
    body: [
      "Users can reset passwords from the sign-in page using the Forgot password link.",
      "Password reset links expire after 60 minutes and can only be used once.",
      "If SSO is enforced for a workspace, password reset is disabled for managed users.",
      "Admins can require all members to re-authenticate from the Security settings page.",
    ].join("\n\n"),
  },
  {
    title: "SLA Tiers",
    sourceUrl: "https://docs.supportopsai.dev/enterprise/sla",
    tags: ["sla", "enterprise", "support"],
    body: [
      "Standard plan: best-effort support during business hours, no uptime SLA.",
      "Growth plan: 99.9% monthly uptime SLA with next-business-day response for critical tickets.",
      "Enterprise plan: 99.95% monthly uptime SLA with 1-hour response for critical severity incidents.",
      "SLA credits require a support request within 30 days of the incident month.",
    ].join("\n\n"),
  },
  {
    title: "Account Deletion",
    sourceUrl: "https://docs.supportopsai.dev/accounts/account-deletion",
    tags: ["account", "deletion", "privacy"],
    body: [
      "Only workspace owners can permanently delete a workspace account.",
      "Deletion is initiated from Settings > Workspace > Delete workspace.",
      "After deletion is confirmed, login is disabled immediately.",
      "All workspace data follows the data retention and purge timeline policy.",
    ].join("\n\n"),
  },
  {
    title: "API Rate Limits",
    sourceUrl: "https://docs.supportopsai.dev/api/rate-limits",
    tags: ["api", "limits", "developer"],
    body: [
      "Public API requests are limited per workspace and plan tier.",
      "Standard plan: 120 requests per minute.",
      "Growth plan: 600 requests per minute.",
      "Enterprise plan: 1200 requests per minute with burst allowances by contract.",
    ].join("\n\n"),
  },
  {
    title: "Workspace Permissions",
    sourceUrl: "https://docs.supportopsai.dev/accounts/workspace-permissions",
    tags: ["account", "roles", "permissions"],
    body: [
      "Workspace roles are Owner, Admin, Agent, and Viewer.",
      "Only Owners and Admins can modify billing settings.",
      "Only Owners can delete a workspace or transfer ownership.",
      "Agents can manage tickets but cannot change identity or billing configuration.",
    ].join("\n\n"),
  },
  {
    title: "Legacy Refund Terms (Deprecated)",
    sourceUrl: "https://docs.supportopsai.dev/legacy/refund-terms",
    tags: ["billing", "refund", "deprecated", "legacy"],
    body: [
      "Legacy contracts signed before January 1, 2024 had a 14-day refund window.",
      "These terms do not apply to new self-serve signups.",
      "If a customer cites legacy terms but contract status is unclear, escalate to billing operations.",
    ].join("\n\n"),
  },
];
