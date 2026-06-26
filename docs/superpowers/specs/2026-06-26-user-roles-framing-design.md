# Design Spec: User Roles and Framing

This spec covers implementing role-based access control (RBAC) framing with two user profiles: **Admin** and **Viewer**. This helps demonstrate and test user-specific limitations in the Monitoring Rule Management app.

## User Roles

### 1. Admin
- **Behavior**: Uses the application exactly as it exists now. Full read-write access to rule status toggles and modal parameter editing.
- **Visual Identifier**: Shows **"AD"** inside the top-right avatar circle.

### 2. Viewer
- **Behavior**: Read-only access to rule instances on the MR Database page.
- **Visual Identifier**: Shows **"VW"** inside the top-right avatar circle.
- **Limitations**:
  - **Status Toggles**: Individual switches and group switches in the catalog table are opaque (`opacity-40` or `opacity-50`) and non-interactive (`pointer-events-none`).
  - **Edit Button**: Renamed to **"View"** in the actions column.
  - **Edit Modal**:
    - Title in header displays **"View..."** instead of **"Edit..."** or matches read-only naming.
    - All parameter form fields (`input` elements) are `disabled`.
    - The bottom buttons **"Cancel"** and **"Save"** are removed and replaced by a single **"Close"** button.

---

## Technical Architecture

### 1. Global User Role Context (`UserRoleContext.tsx`)
We will create a context to track and update the active user role.
- **Location**: `components/context/UserRoleContext.tsx`
- **Properties**:
  - `role`: `'admin' | 'viewer'`
  - `setRole`: `(role: 'admin' | 'viewer') => void`
- **State Persistence**: The active role will be loaded from and saved to `localStorage` under the key `'user-role'`. The default role is `'admin'`.
- **Integration**: The provider will wrap the children in `RootLayout` (`app/layout.tsx`).

### 2. Header / Topbar User Selector (`Topbar.tsx`)
- The user avatar circle containing the initials (currently static **"EP"**) will display **"AD"** when in Admin mode, and **"VW"** when in Viewer mode.
- Clicking the avatar button will toggle an interactive dropdown menu overlay.
- The dropdown will show two selectable options:
  - **Admin**
  - **Viewer**
- Selecting an option will update the context state and automatically persist the choice.

### 3. MR Database Catalog Table (`RuleInstanceTable.tsx`)
- Consume the role context using `useUserRole()`.
- **Toggles**:
  - If the role is `'viewer'`, add `opacity-40 pointer-events-none` to:
    - Group Switch row component: `Switch.Root`
    - Individual Switch cell component: `Switch.Root`
- **Action Button**:
  - Rename the action button text from `"Edit"` to `"View"` if the role is `'viewer'`.

### 4. Details / Edit Modal (`EditRuleModal.tsx`)
- Consume the role context using `useUserRole()`.
- If the role is `'viewer'`:
  - Wrap all editable `<input>` and form control elements with `disabled` attribute.
  - For the footer buttons:
    - Omit the standard `"Cancel"` and `"Save"` buttons.
    - Render a single `"Close"` button that calls `onClose()`.
  - Update the dialog title to `"View Surge Margin Parameters"` / `"View Spike Detection Parameters"` / `"Monitoring Rule — Details"`.

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify there are no compilation errors.
- Run `npm run lint` to check for type-safety and syntax issues.

### Manual Verification
- Verify the avatar shows **"AD"** by default in the topbar.
- Click the avatar and select **"Viewer"**.
  - Check that the avatar changes to **"VW"**.
  - Check that the toggles in the table are opaque/faded and cannot be clicked.
  - Check that the "Edit" button changes to "View".
  - Click the "View" button for any Spike, Surge, or Generic rule.
    - Check that the inputs inside the modal are disabled and faded.
    - Check that "Cancel" and "Save" buttons are missing, and only a "Close" button is available.
- Switch back to **"Admin"** and verify that full functionality is restored.
