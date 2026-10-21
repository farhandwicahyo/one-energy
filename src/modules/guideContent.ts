// Step-by-step user guide. Each section matches the screens and button labels in the app.
export interface GuideTask { title: string; steps: string[]; tip?: string }
export interface GuideSection { id: string; code: string; name: string; who: string; open?: string; intro: string; tasks: GuideTask[] }

export const GUIDE: GuideSection[] = [
  {
    id: 'start', code: 'START', name: 'Getting started', who: 'Everyone',
    intro: 'OneEnergy keeps every vessel, crew member and document in one place, and warns the right person before anything expires. What you see depends on your role.',
    tasks: [
      { title: 'Sign in', steps: [
        'Open OneEnergy and enter your username and password.',
        'You land on the home page with the modules your role can use.',
      ], tip: 'After 5 wrong passwords the account locks for 15 minutes. Ask IT if you are locked out.' },
      { title: 'Find what you need', steps: [
        'Use the search box in the header, on any page: type a module code such as E-DOC, a task such as renew or sign on, or a vessel or crew name.',
        'Results are grouped into modules, features, vessels and crew. Click one to open it.',
        'Or click a module card on the home page to see its features, then click a feature to open it.',
        'Use the breadcrumb at the top of each page (Modules › module › feature) to go back.',
      ] },
      { title: 'Your account', steps: [
        'Click the square avatar at the top right.',
        'Choose My profile to see your details, your permissions and your recent changes. You can update your email and WhatsApp number and change your password there.',
        'Choose Read User Guidance to come back to this guide.',
        'Choose Log out when you are done, especially on a shared computer.',
      ] },
    ],
  },
  {
    id: 'dashboard', code: 'Dashboard', name: 'Fleet Monitoring', who: 'Management, Document Admin, Crewing / HR, Operation, IT', open: '/dashboard',
    intro: 'The dashboard is the first thing to check each morning. It shows a different view for each role, and its numbers always match SIAP and E-DOC.',
    tasks: [
      { title: 'Check the fleet (Management)', steps: [
        'Open Dashboard. The top row shows how many vessels are ready, need attention and are not ready.',
        'Click one of those numbers to open the matching list in SIAP.',
        'Read “Documents by expiry” for what expires within 30, 60 and 90 days.',
        'Use “Why vessels are not green” to see which kind of problem is most common.',
      ] },
      { title: 'Work through your tasks (Document Admin, Crewing / HR)', steps: [
        'Open Dashboard and choose My tasks. The list is sorted by the nearest expiry date.',
        'Set the follow-up to In progress when you start a renewal, so colleagues know.',
        'When the new certificate arrives, click Renew on that row and record it.',
        'The item leaves the list as soon as the new version is saved.',
      ] },
      { title: 'Plan sailings (Operation)', steps: [
        'Open Dashboard and choose Operations to see every vessel as a card.',
        'Filter by Ready, Attention or Not ready.',
        'Open a card to see exactly what blocks that vessel.',
      ] },
    ],
  },
  {
    id: 'siap', code: 'SIAP', name: 'Sailing Readiness', who: 'Operation, Management, Document Admin', open: '/m/siap',
    intro: 'SIAP marks each vessel green, yellow or red from its documents and crew. Red means an expired or missing required document, or crew below the minimum. Yellow means something expires soon.',
    tasks: [
      { title: 'See why a vessel is not ready', steps: [
        'Open SIAP › Fleet readiness and filter by Not ready.',
        'Click the vessel. Issues are grouped into vessel documents, crew certificates and crew composition.',
        'Each issue names the person responsible. Click Open document to go straight to it.',
        'Forward the issue to the Document Admin or Crewing. The status turns green by itself once it is fixed.',
      ] },
      { title: 'Check a planned departure date', steps: [
        'Open the vessel in SIAP.',
        'Under “Check a departure date”, pick the date or use +7, +14, +30 or +60 days.',
        'Issues marked “By departure” are documents that are valid today but expire before that date.',
        'Click Save this check to keep the result as a snapshot.',
      ] },
      { title: 'Check a TB/BG pair', steps: [
        'Open SIAP › TB/BG pair readiness.',
        'A pair is only as ready as its weaker half, so its status is the worse of the tug and the barge.',
      ] },
    ],
  },
  {
    id: 'siska', code: 'SISKA', name: 'Vessels', who: 'Document Admin, Operation, Asset, IT', open: '/m/siska',
    intro: 'SISKA is the master record of every tug boat and barge: its particulars, operating status and pairing.',
    tasks: [
      { title: 'Add a vessel', steps: [
        'Open SISKA › All vessels and click Add vessel.',
        'Fill in the identity, registration and main particulars. The name must be unique.',
        'For a barge that carries coal, tick Carries coal so the coal barge certificate becomes required.',
        'Click Add vessel. It shows as not ready until its required documents are uploaded in E-DOC.',
      ] },
      { title: 'Edit or delete a vessel', steps: [
        'In the vessel list, click Details on the vessel, then Edit or Delete at the top of its page.',
        'Change the fields and click Save changes. Every change is kept in the audit log.',
        'To delete, write the reason and confirm. The pairing ends today and its crew are signed off; the documents stay in the archive.',
      ] },
      { title: 'Change operating status (Operation)', steps: [
        'Open the vessel and click Change status.',
        'Choose Operating, Standby, Docking or Repair and write the reason.',
        'The change appears in the Status history tab with your name and the date.',
      ] },
      { title: 'Pair a tug and a barge', steps: [
        'Open SISKA › TB/BG pairs.',
        'Choose the tug, the barge and the start date, then click Create pair.',
        'A barge can only be towed by one tug at a time. End the old pair first if needed.',
      ] },
      { title: 'Update asset data (Asset)', steps: [
        'Open the vessel and go to the Asset tab.',
        'Click Edit asset, change the values and click Save asset.',
      ] },
    ],
  },
  {
    id: 'si-crew', code: 'SI-CREW', name: 'Crew', who: 'Crewing / HR (full access), other roles read only', open: '/m/si-crew',
    intro: 'SI-CREW keeps permanent and contract crew, their assignments and their contracts. Personal data and contracts are visible to Crewing / HR only.',
    tasks: [
      { title: 'Add a crew member', steps: [
        'Open SI-CREW › All crew and click Add crew member.',
        'Fill in the name, rank, employment type and join date.',
        'Fill in the personal data and emergency contact. The NIK must have 16 digits.',
        'Click Add crew member. They start as standby. Upload their certificates in E-DOC before signing them on.',
      ] },
      { title: 'Edit, update personal data or delete', steps: [
        'Open the crew member and click Edit to change the work details.',
        'Go to the Personal tab and click Edit to change personal data or the emergency contact.',
        'Click Delete, write the reason and confirm to remove the record. If they were aboard, they are signed off today.',
      ] },
      { title: 'Sign crew on and off', steps: [
        'Open SI-CREW › Crew composition and choose the vessel.',
        'Each rank shows how many are aboard against the minimum. Short ranks are red.',
        'Click Sign on, choose a standby crew member of that rank and the date.',
        'To sign someone off, click Sign off next to their name.',
      ], tip: 'A crew member cannot be active on two vessels at once. Sign them off the first vessel before signing them on another.' },
      { title: 'Record a contract', steps: [
        'Open the crew member and go to the Contract tab.',
        'Click New contract, enter the number, start and end dates, and attach the signed PDF.',
        'The end date now gets reminders like any other document.',
      ] },
      { title: 'Print a crew list', steps: [
        'Open SI-CREW › Crew composition and choose the vessel.',
        'Under “Crew list on a date”, pick the date, then click PDF or Excel.',
      ] },
    ],
  },
  {
    id: 'e-doc', code: 'E-DOC', name: 'Documents', who: 'Document Admin, Crewing / HR', open: '/m/e-doc',
    intro: 'E-DOC stores every vessel and crew document with its scan. Its status (valid, expiring soon, expired) is worked out from the expiry date, so nobody has to update it by hand.',
    tasks: [
      { title: 'Add a document', steps: [
        'Open E-DOC › All documents and click Add document.',
        'Choose whether it belongs to a vessel or a crew member, then pick the owner and the document type.',
        'Enter the number and dates, and attach the scan (PDF, JPG or PNG, up to 10 MB).',
        'Click Save document. Reminders are scheduled from the expiry date straight away.',
      ] },
      { title: 'Renew a document', steps: [
        'Open the document, or find it in My tasks, and click Renew.',
        'Enter the new number and dates and attach the new scan.',
        'Click Record new version. The old version is archived, its reminders stop and the follow-up becomes Done.',
      ] },
      { title: 'Correct or delete a document', steps: [
        'Use Correct to fix a typing mistake in the number, dates or issuer. Use Renew, not Correct, for a newly issued certificate.',
        'Use Delete for a document recorded by mistake. Write the reason and confirm. If there was an earlier version, it becomes current again.',
      ] },
      { title: 'Manage document types and required documents', steps: [
        'Open E-DOC › Document types to add a type or change when “expiring soon” and reminders start.',
        'Open E-DOC › Required documents to tick what each vessel type and each rank must hold.',
        'SIAP checks against these rules immediately.',
      ] },
    ],
  },
  {
    id: 'sinar', code: 'SINAR', name: 'Reminders', who: 'Document Admin, Crewing / HR, IT', open: '/m/sinar',
    intro: 'SINAR sends WhatsApp and email reminders 90, 60, 30 and 7 days before a document expires, to the person who recorded it, and keeps sending until it is renewed.',
    tasks: [
      { title: 'Follow up a reminder', steps: [
        'Open SINAR › Follow-up. Each row shows which reminder stages have been sent.',
        'Set the follow-up to In progress while you arrange the renewal.',
        'Click Renew when the new document arrives. The reminders stop by themselves.',
      ] },
      { title: 'Fix failed messages (IT)', steps: [
        'Open SINAR › Delivery monitor and filter by Failed.',
        'Read the reason. For a temporary error, click Resend.',
        'If the reason is “Recipient inactive”, click Reassign.',
      ] },
      { title: 'Move reminders when staff change (IT)', steps: [
        'Open SINAR › Recipients and escalation.',
        'Under “Move all from”, pick the old recipient and the new one, then click Move.',
        'Failed reminders are queued again for the new recipient.',
      ] },
      { title: 'Edit a message template (IT)', steps: [
        'Open SINAR › Message templates and choose a template.',
        'Edit the text. Keep the variables in double braces, such as {{tgl_berlaku}}.',
        'Check the preview and click Save template. A WhatsApp template goes back to the provider for approval.',
      ] },
    ],
  },
  {
    id: 'siguna', code: 'SIGUNA', name: 'Users & Access', who: 'IT', open: '/m/siguna',
    intro: 'SIGUNA controls who can see and change what, records every change, and holds the shared master data.',
    tasks: [
      { title: 'Add or edit a user', steps: [
        'Open SIGUNA › Users and click New user, or the pencil next to an existing user.',
        'Fill in the name, username, email and WhatsApp number, and tick one or more roles.',
        'Click Create user. Give them the temporary password; they must change it at first sign-in.',
      ] },
      { title: 'Deactivate a user or reset a password', steps: [
        'Click Deactivate next to the user. They cannot sign in and all their sessions end at once.',
        'If they still receive reminders, move them in SINAR › Recipients and escalation.',
        'Click Reset password to issue a new temporary password.',
      ] },
      { title: 'Change what a role can do', steps: [
        'Open SIGUNA › Roles and permissions.',
        'Pick a permission group, then tick or untick the box for each role.',
      ] },
      { title: 'Review changes', steps: [
        'Open SIGUNA › Audit log and filter by table or user.',
        'Click a row to see the before and after values.',
      ] },
      { title: 'Maintain master data', steps: [
        'Open SIGUNA › Master data.',
        'Choose Vessel types or Ranks, then click Add or the pencil to edit.',
        'Entries in use are deactivated, never deleted, so old records keep their meaning.',
      ] },
    ],
  },
]
