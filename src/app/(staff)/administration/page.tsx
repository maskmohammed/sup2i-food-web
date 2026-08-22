import { redirect } from "next/navigation";

/**
 * /administration n'a pas de contenu propre — c'est une entrée de nav
 * groupant plusieurs sous-sections (catalogue/étudiants/utilisateurs/
 * audit/promotions), chacune déjà protégée par son propre RequireRole.
 * On redirige vers la première plutôt que de laisser un 404.
 */
export default function AdministrationPage() {
  redirect("/administration/catalogue");
}
