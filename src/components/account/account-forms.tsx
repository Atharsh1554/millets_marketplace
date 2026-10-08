"use client";

import { changePasswordAction, createComplaintAction, deleteAddressAction, setDefaultAddressAction, updateFarmProfileAction, updateProfileAction } from "@/app/actions/account";
import { addAddressAction } from "@/app/actions/shop";
import { ActionButton, ActionForm, SubmitButton, TextArea, TextField } from "@/components/forms";
import { useT } from "@/i18n/client";

export function ProfileForm({ name, phone, email, role }: { name: string; phone: string; email: string; role: string }) {
  const t = useT();
  return (
    <ActionForm action={updateProfileAction} className="grid gap-4 sm:grid-cols-2">
      <TextField label={t("fields.fullName")} name="name" required defaultValue={name} autoComplete="name" />
      <TextField label={t("fields.phone")} name="phone" type="tel" required defaultValue={phone} autoComplete="tel" />
      <TextField label={t("fields.email")} name="email" defaultValue={email} disabled hint={t("account.emailHint")} />
      <TextField label={t("account.accountType")} name="roleLabel" defaultValue={role} disabled />
      <div className="sm:col-span-2">
        <SubmitButton>{t("account.saveProfile")}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function PasswordForm() {
  const t = useT();
  return (
    <ActionForm action={changePasswordAction} resetOnSuccess className="grid gap-4 sm:grid-cols-3">
      <TextField label={t("account.currentPassword")} name="currentPassword" type="password" required autoComplete="current-password" />
      <TextField label={t("account.newPassword")} name="newPassword" type="password" required autoComplete="new-password" hint={t("auth.passwordHint")} />
      <TextField label={t("account.confirmPassword")} name="confirmPassword" type="password" required autoComplete="new-password" />
      <div className="sm:col-span-3">
        <SubmitButton>{t("account.changePassword")}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function FarmProfileForm(d: { village: string; district: string; state: string; farmLocation: string; upiId: string }) {
  const t = useT();
  return (
    <ActionForm action={updateFarmProfileAction} className="grid gap-4 sm:grid-cols-3">
      <TextField label={t("fields.village")} name="village" required defaultValue={d.village} />
      <TextField label={t("fields.district")} name="district" required defaultValue={d.district} />
      <TextField label={t("fields.state")} name="state" required defaultValue={d.state} />
      <TextField label={t("account.farmLocation")} name="farmLocation" defaultValue={d.farmLocation} className="sm:col-span-2" placeholder={t("account.farmLocationPlaceholder")} />
      <TextField label={t("account.upiId")} name="upiId" defaultValue={d.upiId} placeholder="name@bank" />
      <div className="sm:col-span-3">
        <SubmitButton>{t("account.saveFarmProfile")}</SubmitButton>
      </div>
    </ActionForm>
  );
}

export function AddressBook({ addresses }: { addresses: Array<{ id: string; label: string; isDefault: boolean }> }) {
  const t = useT();
  return (
    <div className="space-y-4">
      {addresses.length === 0 && <p className="text-sm text-muted">{t("account.noAddresses")}</p>}
      <ul className="space-y-2">
        {addresses.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cream p-3 text-sm">
            <span className="min-w-0 flex-1">
              {a.label}
              {a.isDefault && <span className="ml-2 rounded-full bg-leaf-50 px-2 py-0.5 text-xs font-semibold text-leaf-800 ring-1 ring-leaf-200">{t("account.default")}</span>}
            </span>
            <span className="flex gap-2">
              {!a.isDefault && (
                <ActionButton action={setDefaultAddressAction} fields={{ id: a.id }} variant="outline">
                  {t("account.makeDefault")}
                </ActionButton>
              )}
              <ActionButton action={deleteAddressAction} fields={{ id: a.id }} variant="dangerOutline" confirm={t("account.removeAddressConfirm")}>
                {t("common.actions.remove")}
              </ActionButton>
            </span>
          </li>
        ))}
      </ul>
      <AddressFields title={t("account.addAddress")} />
    </div>
  );
}

/** New-address form (also used during checkout). */
export function AddressFields({ title, onSaved, onCancel }: { title?: string; onSaved?: (id: string) => void; onCancel?: () => void }) {
  const t = useT();
  return (
    <ActionForm
      action={async (prev, fd) => {
        const res = await addAddressAction(prev, fd);
        if (res?.ok && onSaved) onSaved((res.data as { id: string }).id);
        return res;
      }}
      resetOnSuccess
      className="grid gap-4 rounded-2xl border border-earth-100 bg-cream p-4 sm:grid-cols-2"
    >
      {title && <p className="font-semibold text-earth-900 sm:col-span-2">{title}</p>}
      <TextField label={t("fields.fullName")} name="fullName" required autoComplete="name" />
      <TextField label={t("fields.phone")} name="phone" type="tel" required autoComplete="tel" />
      <TextField label={t("fields.addressLine1")} name="line1" required className="sm:col-span-2" autoComplete="address-line1" />
      <TextField label={t("account.addressLine2")} name="line2" className="sm:col-span-2" autoComplete="address-line2" />
      <TextField label={t("fields.city")} name="city" required autoComplete="address-level2" />
      <TextField label={t("fields.district")} name="district" required />
      <TextField label={t("fields.state")} name="state" required autoComplete="address-level1" />
      <TextField label={t("account.pincode")} name="pincode" required inputMode="numeric" maxLength={6} autoComplete="postal-code" />
      <div className="flex gap-2 sm:col-span-2">
        <SubmitButton>{t("account.saveAddress")}</SubmitButton>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-earth-700 hover:bg-earth-50">
            {t("common.actions.cancel")}
          </button>
        )}
      </div>
    </ActionForm>
  );
}

export function ComplaintForm({ orderId }: { orderId: string }) {
  const t = useT();
  return (
    <ActionForm action={createComplaintAction} resetOnSuccess className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <TextField label={t("fields.subject")} name="subject" required placeholder={t("account.complaintSubjectPlaceholder")} />
      <TextArea label={t("account.complaintDescribe")} name="message" required rows={3} />
      <SubmitButton variant="outline">{t("account.submitComplaint")}</SubmitButton>
    </ActionForm>
  );
}
