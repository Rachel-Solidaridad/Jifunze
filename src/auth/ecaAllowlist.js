// Source: "Solidaridad ECA 2026 Google Workspace Email Accounts v26-06-2026
// Version 2" — the canonical roster maintained by the ECA admin team.
//
// Sign-in is restricted to addresses on this list (plus the
// @solidaridadnetwork.org domain check in App.jsx#isAllowedEmail), so a
// Solidaridad staffer from another region cannot get into the ECA learning
// platform. When the roster changes, update this file and the live site
// picks it up at the next deploy — no Firebase config or rules change
// required.
//
// All entries are lowercased; the lookup helper lowercases the candidate
// email too, so case mismatches at the IdP don't lock people out.

export const ECA_EMAIL_ALLOWLIST = [
  'adugna.buli@solidaridadnetwork.org',
  'alex.amanya@solidaridadnetwork.org',
  'alex.nzioki@solidaridadnetwork.org',
  'alfred.mubangizi@solidaridadnetwork.org',
  'amina.msofe@solidaridadnetwork.org',
  'andrew.wanok@solidaridadnetwork.org',
  'anena.harriet@solidaridadnetwork.org',
  'anne.wanjiru@solidaridadnetwork.org',
  'annet.kairu@solidaridadnetwork.org',
  'anteneh.arega@solidaridadnetwork.org',
  'anthony.khisah@solidaridadnetwork.org',
  'asiimwe.sarah@solidaridadnetwork.org',
  'augustine.wanjala@solidaridadnetwork.org',
  'austine.ochieng@solidaridadnetwork.org',
  'berhanu.woldu@solidaridadnetwork.org',
  'betty.musembi@solidaridadnetwork.org',
  'bifered.alemayehu@solidaridadnetwork.org',
  'birtukan.haile@solidaridadnetwork.org',
  'boniface.kariemu@solidaridadnetwork.org',
  'carolyne.mbithe@solidaridadnetwork.org',
  'catherine.odenyo@solidaridadnetwork.org',
  'charity.nasasira@solidaridadnetwork.org',
  'charles.okwiri@solidaridadnetwork.org',
  'christopher.amodo@solidaridadnetwork.org',
  'derrick.kikomeko@solidaridadnetwork.org',
  'dorice.masitsa@solidaridadnetwork.org',
  'edith.wairimu@solidaridadnetwork.org',
  'esther.tino@solidaridadnetwork.org',
  'eunice.magwambo@solidaridadnetwork.org',
  'evelyne.chepkoech@solidaridadnetwork.org',
  'flaviah.koyesiga@solidaridadnetwork.org',
  'geoffrey.rotich@solidaridadnetwork.org',
  'gerald.nyanzi@solidaridadnetwork.org',
  'godfrey.aganyira@solidaridadnetwork.org',
  'godfrey.ndegwa@solidaridadnetwork.org',
  'godlove.nderingo@solidaridadnetwork.org',
  'grace.waweru@solidaridadnetwork.org',
  'harriet.nyakundi@solidaridadnetwork.org',
  'hellen.wangui@solidaridadnetwork.org',
  'innocent.didas@solidaridadnetwork.org',
  'innocent.owomuhangi@solidaridadnetwork.org',
  'jeniffer.kendagor@solidaridadnetwork.org',
  'joan.chepkwemboi@solidaridadnetwork.org',
  'john.vianney@solidaridadnetwork.org',
  'joseph.maberi@solidaridadnetwork.org',
  'joshua.rukundo@solidaridadnetwork.org',
  'joventa.tugumisirize@solidaridadnetwork.org',
  'lawrence.mulei@solidaridadnetwork.org',
  'macharia.maina@solidaridadnetwork.org',
  'mark.okot@solidaridadnetwork.org',
  'marym@solidaridadnetwork.org',
  'mercy.apondi@solidaridadnetwork.org',
  'modesta.kasigara@solidaridadnetwork.org',
  'moses.ndiritu@solidaridadnetwork.org',
  'mugo.kamau@solidaridadnetwork.org',
  'mulatu.shomore@solidaridadnetwork.org',
  'musie.bekele@solidaridadnetwork.org',
  'nancy.ngando@solidaridadnetwork.org',
  'phanuel.ayuka@solidaridadnetwork.org',
  'prisca.wallace@solidaridadnetwork.org',
  'racheal.birungi@solidaridadnetwork.org',
  'rachel.wanyoike@solidaridadnetwork.org',
  'rita.njeri@solidaridadnetwork.org',
  'robert.mburu@solidaridadnetwork.org',
  'rodgers.ademba@solidaridadnetwork.org',
  'rose@solidaridadnetwork.org',
  'roselaida.ngowi@solidaridadnetwork.org',
  'saba.taye@solidaridadnetwork.org',
  'samuel.tatambuka@solidaridadnetwork.org',
  'sanka.shaita@solidaridadnetwork.org',
  'secilia.charles@solidaridadnetwork.org',
  'simon.sulle@solidaridadnetwork.org',
  'stephen.kithuka@solidaridadnetwork.org',
  'sweeny.binsari@solidaridadnetwork.org',
  'sylvia.munai@solidaridadnetwork.org',
  'tilahun.mekonnen@solidaridadnetwork.org',
  'victor.herman@solidaridadnetwork.org',
  'victoria.kalekye@solidaridadnetwork.org',
  'winifrida.kanwa@solidaridadnetwork.org',
];

const ALLOWLIST_SET = new Set(ECA_EMAIL_ALLOWLIST);

export function isOnEcaAllowlist(email) {
  if (!email) return false;
  return ALLOWLIST_SET.has(email.trim().toLowerCase());
}
