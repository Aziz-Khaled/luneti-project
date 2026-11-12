"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../layout/AppShell";
import { DataView, Notice, Panel } from "../ui/DataView";
import { Form, type Field } from "../ui/Form";
import { useAuth, type Portal } from "../../contexts/AuthContext";
import { addressesService } from "../../services/addresses.service";
import { clientsService } from "../../services/clients.service";
import { featuresService } from "../../services/features.service";
import { inventoryService } from "../../services/inventory.service";
import { opticiansService } from "../../services/opticians.service";
import { ordersService } from "../../services/orders.service";
import { productsService } from "../../services/products.service";
import { socialService } from "../../services/social.service";
import { storesService } from "../../services/stores.service";
import { usersService } from "../../services/users.service";
import { backofficeService } from "../../services/backoffice.service";
import { employeeService } from "../../services/employee.service";
import { OpticianDashboard } from "../optician/OpticianDashboard";
import { OpticianOrders } from "../optician/OpticianOrders";
import { OpticianInventory } from "../optician/OpticianInventory";
import { OpticianAppointments } from "../optician/OpticianAppointments";
import { OpticianCustomers } from "../optician/OpticianCustomers";
import { OpticianProducts } from "../optician/OpticianProducts";
import { OpticianMembers } from "../optician/OpticianMembers";
import { OpticianTransactions } from "../optician/OpticianTransactions";
import { OpticianActivity } from "../optician/OpticianActivity";
import { OpticianStore } from "../optician/OpticianStore";
import { OpticianLocations } from "../optician/OpticianLocations";
import { OpticianProfile } from "../optician/OpticianProfile";
import { IconEyeglasses, IconPlus } from "../ui/Icons";
type DataMap = Record<string, unknown>;

const opticianSectionTitles: Record<string, string> = {
  dashboard: "Tableau de bord de la boutique",
  orders: "Gestion des commandes",
  inventory: "Inventaire & Mouvements de stock",
  appointments: "Agenda des rendez-vous",
  customers: "Fichier clientèle",
  products: "Catalogue & Tarifs magasin",
  members: "Équipe & Collaborateurs",
  locations: "Emplacements de stock",
  store: "Paramètres de la boutique",
  transactions: "Transactions & Paiements",
  activity: "Journal d'audit & Traçabilité",
  settings: "Configuration de la boutique",
  profile: "Profil professionnel de l'opticien",
  setup: "Création d'une boutique",
};

const sectionTitles: Record<string, string> = {
  dashboard: "Tableau de bord",
  profile: "Profil",
  stores: "Boutiques",
  products: "Catalogue produits",
  following: "Abonnements",
  addresses: "Mes adresses",
  cart: "Panier",
  orders: "Commandes",
  social: "Fil social",
  appointments: "Rendez-vous",
  prescriptions: "Ordonnances",
  favorites: "Favoris",
  notifications: "Notifications",
  "try-on": "Essai virtuel",
  setup: "Configuration boutique",
  store: "Ma boutique",
  members: "Employés",
  locations: "Emplacements",
  inventory: "Inventaire",
  customers: "Clients",
  transactions: "Transactions",
  activity: "Historique d’activité",
  settings: "Paramètres",
};

const addressFields: Field[] = [
  { name: "type", label: "Type d’adresse", type: "select", options: ["DOMICILE", "FACTURATION", "LIVRAISON", "AUTRE"] },
  { name: "libelle", label: "Libellé" },
  { name: "nom_destinataire", label: "Destinataire" },
  { name: "telephone", label: "Téléphone" },
  { name: "ligne_1", label: "Adresse ligne 1", required: true },
  { name: "ligne_2", label: "Adresse ligne 2" },
  { name: "ville", label: "Ville", required: true },
  { name: "region", label: "Région" },
  { name: "code_postal", label: "Code postal" },
  { name: "code_pays", label: "Code pays (2 lettres)", defaultValue: "TN" },
  { name: "latitude", label: "Latitude", type: "number" },
  { name: "longitude", label: "Longitude", type: "number" },
  { name: "est_par_defaut", label: "Adresse par défaut", type: "checkbox" },
];

export function WorkspacePage({
  portal,
  section,
  resourceId,
}: {
  portal: Portal | "client";
  section: string;
  resourceId?: string;
}) {
  const auth = useAuth();
  const router = useRouter();
  const isClientPortal = portal === "client";
  const [data, setData] = useState<DataMap>({});
  const [pending, setPending] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [version, setVersion] = useState(0);
  const [page, setPage] = useState(1);
  const [productFilters, setProductFilters] = useState({ q: "", type: "" });
  const [editAddressId, setEditAddressId] = useState("");
  const [dashboardRange, setDashboardRange] = useState("30d");
  const [dashboardCustomRange, setDashboardCustomRange] = useState({ from: "", to: "" });
  const [backofficeFilters, setBackofficeFilters] = useState({
    search: "",
    status: "",
    provider: "",
    actorId: "",
    action: "",
    entityType: "",
    from: "",
    to: "",
  });

  const loadData = useCallback(async () => {
    try {
      if (portal === "client") {
        switch (section) {
          case "dashboard":
          case "profile": {
            const [user, client] = await Promise.allSettled([
              usersService.me(),
              clientsService.me(),
            ]);
            setData({
              user: user.status === "fulfilled" ? user.value : null,
              userError: user.status === "rejected" ? messageOf(user.reason) : "",
              client: client.status === "fulfilled" ? client.value : null,
              clientError: client.status === "rejected" ? messageOf(client.reason) : "",
            });
            break;
          }
          case "stores":
            if (resourceId) {
              const [store, storeReviews] = await Promise.all([
                storesService.find(resourceId),
                featuresService.reviewsForStore(resourceId),
              ]);
              setData({ store, storeReviews });
            } else {
              setData({ stores: await storesService.list(page) });
            }
            break;
          case "products":
            if (resourceId) {
              const [product, variants, reviews] = await Promise.all([
                productsService.find(resourceId),
                productsService.variants(resourceId),
                featuresService.reviewsForProduct(resourceId),
              ]);
              setData({ products: [product, variants], reviews });
            } else {
              setData({ products: await productsService.list(page, productFilters.q, productFilters.type) });
            }
            break;
          case "following": {
            const [users, following, followers] = await Promise.all([
              usersService.list(page),
              usersService.following(auth.user!.id, page),
              usersService.followers(auth.user!.id, page),
            ]);
            setData({ users, following, followers });
            break;
          }
          case "addresses":
            setData({ addresses: await addressesService.list() });
            break;
          case "cart":
            setData({ cart: await ordersService.cart() });
            break;
          case "orders":
            setData({ orders: await ordersService.orders(page) });
            break;
          case "social":
            setData({ feed: await socialService.feed(page), ownPosts: await socialService.myPosts(page) });
            break;
          case "appointments":
            setData({ appointments: await featuresService.appointments(page) });
            break;
          case "prescriptions":
            setData({ prescriptions: await clientsService.prescriptions() });
            break;
          case "favorites": {
            const [products, stores] = await Promise.all([
              featuresService.favorites("products", page),
              featuresService.favorites("stores", page),
            ]);
            setData({ favoriteProducts: products, favoriteStores: stores });
            break;
          }
          case "notifications": {
            const [notifications, unread, preferences] = await Promise.all([
              featuresService.notifications(page),
              featuresService.unreadCount(),
              featuresService.notificationPreferences(),
            ]);
            setData({ notifications, unread, preferences });
            break;
          }
          case "try-on": {
            const [policy, sessions] = await Promise.allSettled([
              featuresService.tryOnPolicy(),
              featuresService.tryOnSessions(page),
            ]);
            setData({
              policy: policy.status === "fulfilled" ? policy.value : null,
              policyError: policy.status === "rejected" ? messageOf(policy.reason) : "",
              sessions: sessions.status === "fulfilled" ? sessions.value : null,
              sessionsError: sessions.status === "rejected" ? messageOf(sessions.reason) : "",
            });
            break;
          }
          default:
            break;
        }
      } else {
        const storeId = auth.storeId;
        switch (section) {
          case "dashboard": {
            if (!storeId) break;
            const [dashboard, store] = await Promise.allSettled([
              storesService.dashboard(storeId, {
                range: dashboardRange,
                ...(dashboardRange === "custom" ? dashboardCustomRange : {}),
              }),
              storesService.manage(storeId),
            ]);
            setData({
              dashboard: dashboard.status === "fulfilled" ? dashboard.value : null,
              dashboardError: dashboard.status === "rejected" ? messageOf(dashboard.reason) : "",
              store: store.status === "fulfilled" ? store.value : null,
              storeError: store.status === "rejected" ? messageOf(store.reason) : "",
            });
            break;
          }
          case "store":
            if (storeId) setData({ store: await storesService.manage(storeId) });
            break;
          case "members":
            if (storeId) setData({ members: await storesService.members(storeId, page) });
            break;
          case "locations":
            if (storeId) {
              const [locations, locationTypes] = await Promise.all([
                storesService.locations(storeId),
                storesService.locationTypes(storeId),
              ]);
              setData({ locations, locationTypes });
            }
            break;
          case "products": {
            const [catalog, listings] = await Promise.all([
              resourceId
                ? Promise.all([productsService.find(resourceId), productsService.variants(resourceId)])
                  : productsService.list(page),
                storeId ? storesService.listings(storeId, page) : Promise.resolve(null),
            ]);
            setData({ catalog, listings });
            break;
          }
          case "inventory": {
            if (!storeId) break;
            const [inventory, locations, locationTypes] = await Promise.all([
              inventoryService.list(storeId, page),
              storesService.locations(storeId),
              storesService.locationTypes(storeId),
            ]);
            setData({ inventory, locations, locationTypes });
            break;
          }
          case "appointments":
            if (storeId) setData({ appointments: await storesService.appointments(storeId, page) });
            break;
          case "customers":
            if (storeId) setData({ customers: await storesService.customers(storeId, page) });
            break;
          case "orders":
            if (storeId) {
              if (resourceId) {
                setData({ orderDetail: await backofficeService.order(storeId, resourceId) });
              } else {
                setData({
                  orders: await backofficeService.orders(storeId, page, backofficeFilters),
                });
              }
            }
            break;
          case "transactions":
            if (storeId) {
              setData({
                transactions: await backofficeService.transactions(
                  storeId,
                  page,
                  backofficeFilters,
                ),
              });
            }
            break;
          case "activity":
            if (storeId) {
              setData({
                activity: await backofficeService.activity(
                  storeId,
                  page,
                  backofficeFilters,
                ),
              });
            }
            break;
          case "settings":
            if (storeId) setData({ store: await storesService.manage(storeId) });
            break;
          case "profile":
            setData({ profile: await opticiansService.me() });
            break;
          default:
            break;
        }
      }
    } catch (reason) {
      setError(messageOf(reason));
    } finally {
      setPending(false);
    }
  }, [
    auth.storeId,
    auth.user,
    backofficeFilters,
    dashboardCustomRange,
    dashboardRange,
    page,
    portal,
    productFilters,
    resourceId,
    section,
  ]);

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.user) {
      router.replace("/login");
      return;
    }
    if (portal !== auth.portal) {
      router.replace(`/${auth.portal}/dashboard`);
      return;
    }
    const timer = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(timer);
  }, [auth.loading, auth.portal, auth.user, loadData, portal, router, version]);

  const run = useCallback(async (operation: () => Promise<unknown>, success: string) => {
    setPending(true);
    setError("");
    setNotice("");
    try {
      await operation();
      setNotice(success);
      setVersion((previous) => previous + 1);
    } catch (reason) {
      setPending(false);
      setError(messageOf(reason));
      throw reason;
    }
  }, []);

  const title = useMemo(
    () => {
      if (portal === "optician") {
        return opticianSectionTitles[section] ?? (resourceId ? `Détails #${resourceId.slice(0, 8)}` : "Atelier optique");
      }
      return sectionTitles[section] ?? (resourceId ? `Détails ${section}` : "Lunetty");
    },
    [portal, resourceId, section],
  );
  const pagedValue = getPaginatedValue(portal, section, data, Boolean(resourceId));
  const pagination = getPagination(pagedValue);

  if (auth.loading || !auth.user) {
    return <main className="center-page"><p>Vérification de votre compte…</p></main>;
  }
  if (portal !== auth.portal) {
    return (
      <main className="center-page">
        <section className="panel narrow">
          <h1>Espace non disponible</h1>
          <p className="muted">Votre compte est redirigé vers son espace attribué.</p>
        </section>
      </main>
    );
  }

  return (
    <AppShell portal={portal}>
      <header className="page-header">
        <div>
          <p className="eyebrow">{isClientPortal ? "Espace client" : "Espace Opticien Pro"}</p>
          <h1>{title}</h1>
        </div>
        <div className="header-actions">
          <button className="button secondary" onClick={() => {
            setPending(true);
            setError("");
            setVersion((previous) => previous + 1);
          }} type="button">
            Rafraîchir
          </button>
        </div>
      </header>
      {error && <Notice kind="error">{error}</Notice>}
      {notice && <Notice kind="success">{notice}</Notice>}
      {pending && <p className="muted" role="status">Chargement des données…</p>}
      {pagination && pagination.totalPages > 1 && (
        <nav className="pagination" aria-label="Pagination">
          <button
            className="button secondary"
            disabled={page <= 1 || pending}
            onClick={() => {
              setPending(true);
              setPage((current) => Math.max(1, current - 1));
            }}
            type="button"
          >
            Précédent
          </button>
          <span className="muted">Page {pagination.page} sur {pagination.totalPages} ({pagination.total} enregistrements)</span>
          <button
            className="button secondary"
            disabled={page >= pagination.totalPages || pending}
            onClick={() => {
              setPending(true);
              setPage((current) => Math.min(pagination.totalPages, current + 1));
            }}
            type="button"
          >
            Suivant
          </button>
        </nav>
      )}
      {isClientPortal
        ? renderClientSection()
        : renderOpticianSection()}
    </AppShell>
  );

  function renderClientSection() {
    switch (section) {
      case "dashboard":
        return (
          <div className="content-grid">
            <Panel title={`Bienvenue, ${auth.user?.prenom ?? "sur Lunetty"}`}>
              <p>Parcourez les boutiques et produits, mettez à jour votre profil, gérez vos adresses et testez les parcours disponibles.</p>
              <p className="muted">Rôle du compte depuis l’API : {auth.user?.role}. Aucune statistique simulée n’est affichée.</p>
              {objectData(data.user)}
            </Panel>
            <Panel title="Votre suivi">
              <p>Ouvrez les abonnements pour voir vos listes réelles d’abonnés et d’abonnements.</p>
              <Link className="button secondary" href="/client/following">Gérer les abonnements</Link>
            </Panel>
            <Panel title="Statut du backend">
              <p>Le panier, les commandes, le social, les rendez-vous, les ordonnances, les notifications, les favoris et l’essai virtuel avec consentement sont disponibles à tester.</p>
              <Link className="button secondary" href="/client/cart">Ouvrir le panier</Link>
            </Panel>
          </div>
        );
      case "profile":
        return (
          <div className="content-grid">
            <Panel title="Profil du compte">
              {Boolean(data.userError) && <Notice kind="error">{String(data.userError)}</Notice>}
              {objectData(data.user)}
              <Form
                fields={[
                  { name: "prenom", label: "Prénom" },
                  { name: "nom", label: "Nom" },
                  { name: "nom_utilisateur", label: "Nom d’utilisateur" },
                  { name: "telephone", label: "Téléphone" },
                  { name: "url_image_profil", label: "URL de l’image de profil", type: "url" },
                  { name: "langue_preferee", label: "Langue préférée" },
                ]}
                submitLabel="Mettre à jour le profil"
                onSubmit={(values) => run(() => usersService.updateMe(values), "Profil du compte mis à jour.")}
              />
            </Panel>
            <Panel title="Profil client spécifique">
              {Boolean(data.clientError) && <Notice>{String(data.clientError)}. Enregistrez un champ ci-dessous pour créer votre profil client.</Notice>}
              {objectData(data.client)}
              <Form
                fields={[
                  { name: "date_naissance", label: "Date de naissance", type: "date" },
                  { name: "accepte_marketing", label: "Accepte le marketing", type: "checkbox" },
                ]}
                submitLabel="Enregistrer le profil client"
                onSubmit={(values) => run(() => clientsService.updateMe(values), "Profil client enregistré.")}
              />
            </Panel>
          </div>
        );
      case "stores":
        if (resourceId) {
          return (
            <div className="content-grid">
              <Panel title="Détails de la boutique">{objectData(data.store)}</Panel>
              <Panel title="Avis publiés">
                {objectData(data.storeReviews)}
                <Form
                  fields={[
                    { name: "note", label: "Note (1–5)", type: "number", required: true },
                    { name: "titre", label: "Titre" },
                    { name: "contenu", label: "Avis", type: "textarea" },
                  ]}
                  submitLabel="Soumettre un avis"
                  onSubmit={(values) => run(() => featuresService.createStoreReview(resourceId, values), "Avis soumis pour modération.")}
                />
              </Panel>
              <Panel title="Actions boutique">
                <ActionButton label="Suivre la boutique" onClick={() => run(() => socialService.followStore(resourceId), "Boutique suivie.")} />
                <ActionButton label="Ne plus suivre" onClick={() => run(() => socialService.unfollowStore(resourceId), "Boutique non suivie.")} />
                <ActionButton label="Ajouter aux favoris" onClick={() => run(() => featuresService.favorite("stores", resourceId), "Boutique ajoutée aux favoris.")} />
              </Panel>
              <Panel title="Demander un rendez-vous">
                <Form
                  fields={[
                    { name: "type_service", label: "Service", required: true },
                    { name: "commence_le", label: "Début", type: "datetime-local", required: true },
                    { name: "termine_le", label: "Fin", type: "datetime-local", required: true },
                    { name: "note_client", label: "Note", type: "textarea" },
                  ]}
                  submitLabel="Demander un rendez-vous"
                  onSubmit={async (values) => {
                    const payload = {
                      ...values,
                      commence_le: new Date(String(values.commence_le)).toISOString(),
                      termine_le: new Date(String(values.termine_le)).toISOString(),
                      magasin_id: resourceId,
                    };
                    return run(() => featuresService.createAppointment(payload), "Rendez-vous demandé.");
                  }}
                />
              </Panel>
            </div>
          );
        }
        return (
          <Panel title="Boutiques actives" description="Chargées depuis GET /stores. Les adresses des boutiques ne sont pas incluses dans la réponse backend.">
            {entityCards(data.stores, (id) => `/client/stores/${id}`, "Ouvrir la boutique")}
          </Panel>
        );
      case "products":
        if (resourceId) {
          const pair = Array.isArray(data.products) ? data.products : [];
          return (
            <div className="content-grid">
              <Panel title="Détails du produit">{objectData(pair[0])}</Panel>
              <Panel title="Variantes">{objectData(pair[1])}</Panel>
              <Panel title="Avis publiés">{objectData(data.reviews)}</Panel>
              <Panel title="Actions produit">
                <ActionButton label="Ajouter aux favoris" onClick={() => run(() => featuresService.favorite("products", resourceId), "Produit ajouté aux favoris.")} />
                <Form
                  fields={[
                    { name: "note", label: "Note (1–5)", type: "number", required: true },
                    { name: "titre", label: "Titre" },
                    { name: "contenu", label: "Avis", type: "textarea" },
                  ]}
                  submitLabel="Soumettre un avis"
                  onSubmit={(values) => run(() => featuresService.createProductReview(resourceId, values), "Avis soumis pour modération.")}
                />
              </Panel>
            </div>
          );
        }
        return (
          <Panel title="Produits actifs">
            <Form
              fields={[
                { name: "q", label: "Terme de recherche" },
                { name: "type", label: "Type", type: "select", options: ["MONTURE", "VERRE", "LENTILLE_CONTACT", "ACCESSOIRE"] },
              ]}
              submitLabel="Rechercher dans le catalogue"
              onSubmit={async (values) => {
                setError("");
                setPending(true);
                setPage(1);
                setProductFilters({
                  q: String(values.q ?? ""),
                  type: String(values.type ?? ""),
                });
              }}
            />
            {entityCards(data.products, (id) => `/client/products/${id}`, "Voir le produit")}
          </Panel>
        );
      case "following":
        return (
          <div className="content-grid">
            <Panel title="Utilisateurs publics">
              {entityCards(data.users, (id) => `/client/following/${id}`, "Voir le profil")}
              <Form fields={[{ name: "user_id", label: "ID utilisateur à suivre", required: true }]} submitLabel="Suivre l’utilisateur"
                onSubmit={(values) => run(() => usersService.follow(String(values.user_id)), "Utilisateur suivi.")} />
              <Form fields={[{ name: "user_id", label: "ID utilisateur à ne plus suivre", required: true }]} submitLabel="Ne plus suivre l’utilisateur"
                onSubmit={(values) => run(() => usersService.unfollow(String(values.user_id)), "Utilisateur ne suit plus.")} />
            </Panel>
            <Panel title="Abonnements">{objectData(data.following)}</Panel>
            <Panel title="Abonnés">{objectData(data.followers)}</Panel>
            {resourceId && <Panel title="Profil public"><ProfileDetail userId={resourceId} run={run} /></Panel>}
          </div>
        );
      case "addresses":
        return (
          <div className="content-grid">
            <Panel title="Adresses enregistrées">
              {addressCards(data.addresses, (id) => setEditAddressId(id), (id) => {
                if (!window.confirm("Supprimer cette adresse ?")) return Promise.resolve();
                return run(() => addressesService.remove(id), "Adresse supprimée.");
              })}
            </Panel>
            <Panel title={editAddressId ? "Modifier l’adresse" : "Créer une adresse"}>
              {editAddressId && (
                <button className="button secondary" onClick={() => setEditAddressId("")} type="button">Annuler la modification</button>
              )}
              <Form
                key={editAddressId || "new-address"}
                fields={addressFields.map((field) => {
                  const address = pageItems(data.addresses)
                    .map(recordOf)
                    .find((record) => record.id === editAddressId);
                  if (!address) return field;
                  const value = address[field.name];
                  return {
                    ...field,
                    defaultValue: typeof value === "string" || typeof value === "number"
                      ? value
                      : field.type === "checkbox"
                        ? Boolean(value)
                        : undefined,
                  };
                })}
                submitLabel={editAddressId ? "Mettre à jour l’adresse" : "Créer l’adresse"}
                onSubmit={async (values) => {
                  await run(
                    () => editAddressId
                      ? addressesService.update(editAddressId, values)
                      : addressesService.create(values),
                    editAddressId ? "Adresse mise à jour." : "Adresse créée.",
                  );
                  setEditAddressId("");
                }}
              />
            </Panel>
          </div>
        );
      case "cart":
        return (
          <div className="content-grid">
            <Panel title="Panier actif" description="Ajoutez un identifiant de variante de boutique ; les prix et les stocks sont résolus côté backend.">
              {objectData(data.cart)}
              <Form fields={[
                { name: "variante_annonce_id", label: "ID de variante de boutique", required: true },
                { name: "quantite", label: "Quantité", type: "number", required: true, defaultValue: 1 },
              ]} submitLabel="Ajouter / mettre à jour l’article"
              onSubmit={(values) => run(() => ordersService.addCartItem(values), "Panier mis à jour.")} />
              <Form fields={[
                { name: "adresse_facturation_id", label: "ID de l’adresse de facturation" },
                { name: "adresse_livraison_id", label: "ID de l’adresse de livraison" },
                { name: "note_client", label: "Note de commande" },
              ]} submitLabel="Créer une commande en attente de paiement"
              onSubmit={(values) => run(() => ordersService.checkout(values), "Commande créée. Le paiement n’est pas disponible tant qu’un fournisseur n’est pas configuré.")} />
              <Form fields={[{ name: "item_id", label: "ID de l’article du panier à retirer", required: true }]} submitLabel="Retirer l’article"
                onSubmit={(values) => run(() => ordersService.removeCartItem(String(values.item_id)), "Article du panier retiré.")} />
              <ActionButton label="Vider le panier" onClick={async () => {
                if (!window.confirm("Vider le panier actif ?")) return;
                await run(() => ordersService.clearCart(), "Panier vidé.");
              }} />
            </Panel>
          </div>
        );
      case "orders":
        return (
          <Panel title="Vos commandes">
            {entityCards(data.orders, (id) => `/client/orders/${id}`, "Ouvrir la commande")}
            {resourceId && (
              <div className="content-grid">
                <Panel title="Détails de la commande"><OrderDetails orderId={resourceId} run={run} /></Panel>
              </div>
            )}
          </Panel>
        );
      case "social":
        return (
          <div className="content-grid">
            <Panel title="Fil public">
              <Form fields={[
                { name: "legende", label: "Texte de publication", type: "textarea", required: true },
                { name: "visibilite", label: "Visibilité", type: "select", options: ["PUBLIC", "PRIVE"], defaultValue: "PUBLIC" },
              ]} submitLabel="Publier"
              onSubmit={(values) => run(() => socialService.createPost(values), "Publication créée.")} />
              {postCards(data.feed, run)}
            </Panel>
            <Panel title="Vos publications">{postCards(data.ownPosts, run, true)}</Panel>
          </div>
        );
      case "appointments":
        return (
          <div className="content-grid">
            <Panel title="Mes rendez-vous">
              {objectData(data.appointments)}
              <Form fields={[{ name: "appointment_id", label: "ID du rendez-vous à annuler", required: true }]} submitLabel="Annuler le rendez-vous"
                onSubmit={(values) => run(() => featuresService.cancelAppointment(String(values.appointment_id)), "Rendez-vous annulé.")} />
            </Panel>
          </div>
        );
      case "prescriptions":
        return (
          <div className="content-grid">
            <Panel title="Mes ordonnances">
              {objectData(data.prescriptions)}
              <Form fields={[
                { name: "titre", label: "Titre" },
                { name: "prescrit_le", label: "Date de prescription", type: "date" },
                { name: "expire_le", label: "Date d’expiration", type: "date" },
                { name: "notes", label: "Notes", type: "textarea" },
                { name: "yeux", label: 'Détails des yeux JSON (ex. [{"cote":"DROIT"},{"cote":"GAUCHE"}])', type: "textarea", required: true },
              ]} submitLabel="Enregistrer l’ordonnance"
              onSubmit={async (values) => {
                let yeux: unknown;
                try { yeux = JSON.parse(String(values.yeux)); } catch { throw new Error("Les détails des yeux doivent être un JSON valide."); }
                if (!Array.isArray(yeux)) throw new Error("Les détails des yeux doivent être un tableau JSON.");
                return run(() => clientsService.createPrescription({ ...values, yeux }), "Ordonnance créée.");
              }} />
              <Form fields={[{ name: "prescription_id", label: "ID de l’ordonnance à supprimer", required: true }]} submitLabel="Supprimer l’ordonnance"
                onSubmit={(values) => run(() => clientsService.removePrescription(String(values.prescription_id)), "Ordonnance supprimée.")} />
            </Panel>
          </div>
        );
      case "favorites":
        return (
          <div className="content-grid">
            <Panel title="Produits favoris">
              {objectData(data.favoriteProducts)}
              <Form fields={[{ name: "product_id", label: "ID du produit à retirer", required: true }]} submitLabel="Retirer des favoris"
                onSubmit={(values) => run(() => featuresService.unfavorite("products", String(values.product_id)), "Produit retiré des favoris.")} />
            </Panel>
            <Panel title="Boutiques favorites">
              {objectData(data.favoriteStores)}
              <Form fields={[{ name: "store_id", label: "ID de la boutique à retirer", required: true }]} submitLabel="Retirer la boutique des favoris"
                onSubmit={(values) => run(() => featuresService.unfavorite("stores", String(values.store_id)), "Boutique retirée des favoris.")} />
            </Panel>
          </div>
        );
      case "notifications":
        return (
          <div className="content-grid">
            <Panel title="Notifications" action={<span className="badge">Non lus : {String(recordOf(data.unread).count ?? "—")}</span>}>
              {objectData(data.notifications)}
              <Form fields={[{ name: "notification_id", label: "ID de la notification", required: true }]} submitLabel="Marquer comme lu"
                onSubmit={(values) => run(() => featuresService.markNotificationRead(String(values.notification_id)), "Notification marquée comme lue.")} />
              <ActionButton label="Tout marquer comme lu" onClick={() => run(() => featuresService.markAllNotificationsRead(), "Toutes les notifications en attente ont été marquées comme lues.")} />
            </Panel>
            <Panel title="Préférences de notification">
              {objectData(data.preferences)}
              <Form fields={[
                { name: "type", label: "Type de notification", type: "select", options: ["MISE_A_JOUR_COMMANDE", "MISE_A_JOUR_PAIEMENT", "MISE_A_JOUR_RENDEZ_VOUS", "NOUVEL_ABONNE", "INTERACTION_PUBLICATION", "PROMOTION", "SYSTEME"], required: true },
                { name: "canal", label: "Canal", type: "select", options: ["DANS_APPLICATION", "EMAIL", "PUSH"], required: true },
                { name: "active", label: "Activé", type: "checkbox", defaultValue: true },
              ]} submitLabel="Enregistrer la préférence"
              onSubmit={(values) => run(() => featuresService.updateNotificationPreference(values), "Préférence enregistrée.")} />
            </Panel>
          </div>
        );
      case "try-on":
        return (
          <div className="content-grid">
            <Panel title="Politique de consentement">
              {Boolean(data.policyError) && <Notice kind="error">{String(data.policyError)}</Notice>}
              {objectData(data.policy)}
              <p className="muted">L’essai virtuel enregistre uniquement le consentement et une session. Aucun téléchargement d’image, stockage ou traitement IA n’est connecté.</p>
              <Form fields={[
                { name: "accepte", label: "J’accepte la politique ci-dessus", type: "checkbox", defaultValue: true, required: true },
                { name: "variante_produit_id", label: "ID optionnel de variante de produit active" },
              ]} submitLabel="Créer une session consentie"
              onSubmit={(values) => run(() => featuresService.createTryOn(values), "Session d’essai virtuel créée.")} />
            </Panel>
            <Panel title="Mes sessions">
              {Boolean(data.sessionsError) && <Notice kind="error">{String(data.sessionsError)}</Notice>}
              {objectData(data.sessions)}
            </Panel>
          </div>
        );
      default:
        return <NotAvailable />;
    }
  }

  function renderOpticianSection() {
    if (section !== "setup" && section !== "profile" && !auth.storeId) {
      return (
        <div className="opt-onboarding-wrap">
          <div className="opt-card opt-onboarding-card">
            <div className="opt-onboarding-icon">
              <IconEyeglasses height={38} width={38} />
            </div>
            <h2>Sélectionnez une boutique pour continuer</h2>
            <p className="muted">
              Aucune boutique associée à votre compte. Créez une boutique pour accéder à votre espace de gestion.
            </p>
            <div className="opt-onboarding-buttons">
              <Link className="button primary" href="/optician/setup">
                <IconPlus height={16} width={16} /> Créer une nouvelle boutique
              </Link>
            </div>
          </div>
        </div>
      );
    }

    switch (section) {
      case "dashboard":
        return (
          <OpticianDashboard
            data={data}
            range={dashboardRange}
            onRangeChange={(newRange) => {
              setDashboardRange(newRange);
              setPending(true);
            }}
            customRange={dashboardCustomRange}
            onCustomRangeChange={setDashboardCustomRange}
            onApplyCustomRange={() => {
              setPending(true);
              setVersion((previous) => previous + 1);
            }}
          />
        );

      case "setup":
        return (
          <div className="opt-card">
            <div className="opt-card-header">
              <div>
                <h3>Créer votre boutique</h3>
                <p className="opt-card-sub">
                  Remplissez les informations ci-dessous. Les champs marqués d’un astérisque sont obligatoires.
                </p>
              </div>
            </div>
            <div className="opt-card-body">
              <Form
                className="store-create-form"
                fields={[
                  { name: "nom", label: "Nom de la boutique", required: true, placeholder: "Ex. : Optique du Centre" },
                  { name: "code_enregistrement", label: "Code RNE (facultatif)", placeholder: "Saisissez le code RNE de votre entreprise" },
                  { name: "adresse_ligne_1", label: "Rue et numéro", required: true, placeholder: "Ex. : 10, avenue Habib Bourguiba" },
                  { name: "adresse_ville", label: "Ville", required: true, placeholder: "Ex. : Tunis" },
                  { name: "adresse_region", label: "Gouvernorat (facultatif)", placeholder: "Ex. : Tunis" },
                  { name: "adresse_code_postal", label: "Code postal (facultatif)", placeholder: "Ex. : 1000" },
                  { name: "description", label: "Quelques mots sur votre boutique (facultatif)", type: "textarea", placeholder: "Présentez vos services et votre boutique en quelques mots." },
                  { name: "email", label: "Email de contact (facultatif)", type: "email", placeholder: "contact@votreboutique.tn" },
                  { name: "telephone", label: "Téléphone (facultatif)", placeholder: "+216 71 000 000" },
                  { name: "url_site_web", label: "Site internet (facultatif)", type: "url", placeholder: "https://votreboutique.tn" },
                  { name: "url_logo", label: "Lien du logo (facultatif)", type: "url", placeholder: "Collez ici le lien de votre logo", upload: { name: "logoFile", label: "Téléverser", accept: "image/png,image/jpeg,image/webp,image/avif" } },
                  { name: "url_image_couverture", label: "Lien de l’image de présentation (facultatif)", type: "url", placeholder: "Collez ici le lien de votre image", upload: { name: "coverFile", label: "Téléverser", accept: "image/png,image/jpeg,image/webp,image/avif" } },
                ]}
                submitLabel="Créer ma boutique"
                onSubmit={async (values) => run(async () => {
                  const payload: Record<string, unknown> = { ...values };
                  const logoFile = payload.logoFile instanceof File ? payload.logoFile : undefined;
                  const coverFile = payload.coverFile instanceof File ? payload.coverFile : undefined;
                  delete payload.logoFile;
                  delete payload.coverFile;

                  const store = await storesService.create(payload);
                  const id = recordOf(store).id;
                  if (typeof id === "string") {
                    const uploadedImages: Record<string, string> = {};
                    if (logoFile) {
                      const result = await storesService.uploadBrandingImage(id, "logo", logoFile);
                      if (typeof result.url === "string") uploadedImages.url_logo = result.url;
                    }
                    if (coverFile) {
                      const result = await storesService.uploadBrandingImage(id, "cover", coverFile);
                      if (typeof result.url === "string") uploadedImages.url_image_couverture = result.url;
                    }
                    if (Object.keys(uploadedImages).length > 0) {
                      await storesService.update(id, uploadedImages);
                    }
                    auth.setStoreId(id);
                    router.push("/optician/dashboard");
                  }
                }, "Votre boutique a bien été créée. Vous pouvez maintenant gérer ses informations et ses services.")}
              />
            </div>
          </div>
        );

      case "store":
        return (
          <OpticianStore
            key={`${auth.storeId}-${version}-${JSON.stringify(data.store ?? null)}`}
            storeData={data.store}
            storeId={auth.storeId}
            onUpdateStore={(values) => run(() => storesService.update(auth.storeId, values), "Informations de la boutique mises à jour.")}
            onUploadImage={async (type, file) => {
              const result = await storesService.uploadBrandingImage(auth.storeId, type, file);
              const url = result.url;
              if (typeof url !== "string") {
                throw new Error("Le serveur n’a pas renvoyé l’URL de l’image.");
              }
              return url;
            }}
            onArchiveStore={async () => {
              await run(
                () => storesService.archive(auth.storeId),
                "La boutique a été fermée. Ses données sont conservées.",
              );
              auth.setStoreId("");
              router.replace("/optician/setup");
            }}
          />
        );

      case "members":
        return (
          <OpticianMembers
            membersData={data.members}
            storeId={auth.storeId}
            onCreateEmployee={(input) => run(() => storesService.createEmployee(auth.storeId, input), "Compte employé créé. Le mot de passe temporaire devra être changé à la première connexion.")}
            onUpdateMember={(memberId, input) => run(() => storesService.updateMember(auth.storeId, memberId, input), "Rôle/statut du membre mis à jour.")}
            onRemoveMember={(memberId) => run(() => storesService.removeMember(auth.storeId, memberId), "Collaborateur retiré de l'équipe.")}
            onLoadPermissions={async (memberId) => {
              const [catalog, permissions] = await Promise.all([
                employeeService.catalog(auth.storeId),
                employeeService.memberPermissions(auth.storeId, memberId),
              ]);
              return { catalog, permissions };
            }}
            onSavePermissions={async (memberId, input) => {
              const updated = await employeeService.updateMemberPermissions(auth.storeId, memberId, input);
              setVersion((previous) => previous + 1);
              return updated;
            }}
          />
        );

      case "orders":
        return (
          <OpticianOrders
            ordersData={data.orders}
            orderDetailData={data.orderDetail}
            resourceId={resourceId}
            storeId={auth.storeId}
            filters={{
              search: backofficeFilters.search,
              status: backofficeFilters.status,
              from: backofficeFilters.from,
              to: backofficeFilters.to,
            }}
            onFilterChange={(newFilters) => {
              setPage(1);
              setBackofficeFilters((prev) => ({
                ...prev,
                ...newFilters,
              }));
              setPending(true);
            }}
            onUpdateStatus={(orderId, status, note) =>
              run(
                () => backofficeService.updateOrderStatus(auth.storeId, orderId, { status, note }),
                "Statut de la commande mis à jour.",
              )
            }
          />
        );

      case "transactions":
        return (
          <OpticianTransactions
            transactionsData={data.transactions}
            storeId={auth.storeId}
            filters={{
              search: backofficeFilters.search,
              status: backofficeFilters.status,
              provider: backofficeFilters.provider,
              from: backofficeFilters.from,
              to: backofficeFilters.to,
            }}
            onFilterChange={(newFilters) => {
              setPage(1);
              setBackofficeFilters((prev) => ({
                ...prev,
                ...newFilters,
              }));
              setPending(true);
            }}
          />
        );

      case "activity":
        return (
          <OpticianActivity
            activityData={data.activity}
            storeId={auth.storeId}
            filters={{
              search: backofficeFilters.search,
              actorId: backofficeFilters.actorId,
              action: backofficeFilters.action,
              entityType: backofficeFilters.entityType,
              from: backofficeFilters.from,
              to: backofficeFilters.to,
            }}
            onFilterChange={(newFilters) => {
              setPage(1);
              setBackofficeFilters((prev) => ({
                ...prev,
                ...newFilters,
              }));
              setPending(true);
            }}
            onLoadDetails={(activityId) => backofficeService.activityDetails(auth.storeId, activityId)}
          />
        );

      case "settings":
        return (
          <OpticianStore
            key={`${auth.storeId}-${version}-${JSON.stringify(data.store ?? null)}`}
            storeData={data.store}
            storeId={auth.storeId}
            onUpdateStore={(values) => run(() => storesService.update(auth.storeId, values), "Paramètres de la boutique enregistrés.")}
            onUploadImage={async (type, file) => {
              const result = await storesService.uploadBrandingImage(auth.storeId, type, file);
              const url = result.url;
              if (typeof url !== "string") {
                throw new Error("Le serveur n’a pas renvoyé l’URL de l’image.");
              }
              return url;
            }}
            onArchiveStore={async () => {
              await run(
                () => storesService.archive(auth.storeId),
                "La boutique a été fermée. Ses données sont conservées.",
              );
              auth.setStoreId("");
              router.replace("/optician/setup");
            }}
          />
        );

      case "locations":
        return (
          <OpticianLocations
            locationsData={data.locations}
            storeId={auth.storeId}
            onCreateLocation={(values) => run(() => storesService.createLocation(auth.storeId, values), "Emplacement créé.")}
            onUpdateLocation={(locId, values) => run(() => storesService.updateLocation(auth.storeId, locId, values), "Emplacement mis à jour.")}
          />
        );

      case "products":
        return (
          <OpticianProducts
            catalogData={data.catalog}
            listingsData={data.listings}
            storeId={auth.storeId}
            resourceId={resourceId}
            onCreateListing={(values) => run(() => storesService.createListing(auth.storeId, values), "Annonce magasin créée.")}
            onAddListingVariant={(listingId, values) =>
              run(() => storesService.addListingVariant(auth.storeId, listingId, values), "Variante tarifée ajoutée.")
            }
          />
        );

      case "inventory":
        return (
          <OpticianInventory
            inventoryData={data.inventory}
            locationsData={data.locations}
            locationTypesData={data.locationTypes}
            onApplyMovement={(stockId, input) =>
              run(() => inventoryService.createMovement(auth.storeId, stockId, input), "Mouvement de stock enregistré.")
            }
            onUpdateThreshold={(stockId, seuil) =>
              run(() => inventoryService.update(auth.storeId, stockId, { seuil_reapprovisionnement: seuil }), "Seuil de réapprovisionnement mis à jour.")
            }
            onCreateStock={(input) =>
              run(() => inventoryService.create(auth.storeId, input), "Article ajouté à l'inventaire.")
            }
            onScanReference={(image) =>
              inventoryService.scanReference(auth.storeId, image)
            }
            onCreateLocation={async (input) => {
              const location = await storesService.createLocation(auth.storeId, input);
              setNotice("Emplacement créé.");
              setVersion((previous) => previous + 1);
              return location;
            }}
            onUpdateLocation={async (locationId, input) => {
              const location = await storesService.updateLocation(auth.storeId, locationId, input);
              setNotice("Emplacement mis à jour.");
              setVersion((previous) => previous + 1);
              return location;
            }}
            onCreateLocationType={async (input) => {
              const type = await storesService.createLocationType(auth.storeId, input);
              setNotice("Type d’emplacement créé.");
              setVersion((previous) => previous + 1);
              return type;
            }}
            onUpdateLocationType={async (typeId, input) => {
              const type = await storesService.updateLocationType(auth.storeId, typeId, input);
              setNotice("Type d’emplacement mis à jour.");
              setVersion((previous) => previous + 1);
              return type;
            }}
            onLoadMovements={(stockId) => inventoryService.movements(auth.storeId, stockId)}
          />
        );

      case "appointments":
        return (
          <OpticianAppointments
            appointmentsData={data.appointments}
            storeId={auth.storeId}
            onUpdateStatus={(appointmentId, statut) =>
              run(() => storesService.updateAppointment(auth.storeId, appointmentId, { statut }), "Statut du rendez-vous mis à jour.")
            }
          />
        );

      case "customers":
        return (
          <OpticianCustomers
            customersData={data.customers}
            storeId={auth.storeId}
            onLoadCustomerOrders={(customerId) => storesService.customerOrders(auth.storeId, customerId)}
          />
        );

      case "profile":
        return (
          <OpticianProfile
            profileData={data.profile}
            onUpdateProfile={(values) => run(() => opticiansService.updateMe(values), "Profil professionnel d'opticien enregistré.")}
          />
        );

      default:
        return <NotAvailable />;
    }
  }
}

function ActionButton({
  label,
  onClick,
  danger = false,
}: {
  label: string;
  onClick: () => Promise<void>;
  danger?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState("");
  return (
    <div className="action-control">
      <button className={`button ${danger ? "danger" : "secondary"}`} disabled={pending} onClick={async () => {
        setPending(true);
        setFailure("");
        try { await onClick(); } catch (error) { setFailure(messageOf(error)); } finally { setPending(false); }
      }} type="button">{pending ? "Traitement…" : label}</button>
      {failure && <small className="error-message">{failure}</small>}
    </div>
  );
}

function ProfileDetail({
  userId,
  run,
}: {
  userId: string;
  run: (operation: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const [profile, setProfile] = useState<unknown>(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    usersService.publicProfile(userId).then(setProfile).catch((error) => setFailure(messageOf(error)));
  }, [userId]);
  return (
    <>
      {failure && <Notice kind="error">{failure}</Notice>}
      <DataView value={profile} />
      <ActionButton label="Suivre cet utilisateur" onClick={() => run(() => usersService.follow(userId), "Utilisateur suivi.")} />
      <ActionButton label="Ne plus suivre" onClick={() => run(() => usersService.unfollow(userId), "Utilisateur ne suit plus.")} />
    </>
  );
}

function OrderDetails({
  orderId,
  run,
}: {
  orderId: string;
  run: (operation: () => Promise<unknown>, success: string) => Promise<void>;
}) {
  const [order, setOrder] = useState<unknown>(null);
  const [payments, setPayments] = useState<unknown>(null);
  const [refunds, setRefunds] = useState<unknown>(null);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    Promise.all([
      ordersService.order(orderId),
      ordersService.payments(orderId),
      ordersService.refunds(orderId),
    ])
      .then(([value, paymentRecords, refundRecords]) => {
        setOrder(value);
        setPayments(paymentRecords);
        setRefunds(refundRecords);
      })
      .catch((error) => setFailure(messageOf(error)));
  }, [orderId]);
  return (
    <>
      {failure && <Notice kind="error">{failure}</Notice>}
      <DataView value={order} />
      <Panel title="Historique de paiement (lecture seule)"><DataView value={payments} /></Panel>
      <Panel title="Historique de remboursement (lecture seule)"><DataView value={refunds} /></Panel>
      <ActionButton label="Annuler la commande impayée" danger onClick={async () => {
        if (!window.confirm("Annuler cette commande impayée ?")) return;
        await run(() => ordersService.cancel(orderId), "Commande annulée.");
      }} />
    </>
  );
}

function postCards(
  value: unknown,
  run: (operation: () => Promise<unknown>, success: string) => Promise<void>,
  owned = false,
) {
  const posts = pageItems(value);
  if (!posts.length) return <p className="muted">Aucune publication publique pour le moment.</p>;
  return (
    <div className="entity-list">
      {posts.map((post, index) => {
        const record = recordOf(post);
        const id = stringOf(record.id);
        return (
          <article className="entity-card" key={id || index}>
            <h3>{stringOf(record.legende) || "Publication"}</h3>
            <DataView value={record.auteur} />
            {id && <div className="button-row">
              <ActionButton label="J’aime" onClick={() => run(() => socialService.like(id), "Publication aimée.")} />
              <ActionButton label="Je n’aime plus" onClick={() => run(() => socialService.unlike(id), "Publication désaimée.")} />
              <ActionButton label="Reposter" onClick={() => run(() => socialService.repost(id), "Publication repartagée.")} />
              <ActionButton label="Retirer le repost" onClick={() => run(() => socialService.unrepost(id), "Repost retiré.")} />
              {owned && <ActionButton label="Supprimer la publication" danger onClick={async () => {
                if (!window.confirm("Supprimer cette publication ?")) return;
                await run(() => socialService.deletePost(id), "Publication supprimée.");
              }} />}
              <ActionButton label="Voir les commentaires" onClick={async () => {
                const comments = await socialService.comments(id);
                window.alert(JSON.stringify(comments, null, 2));
              }} />
            </div>}
            {id && owned && <Form fields={[
              { name: "legende", label: "Texte de publication mis à jour", required: true },
              { name: "visibilite", label: "Visibilité", type: "select", options: ["PUBLIC", "PRIVE"], defaultValue: "PUBLIC" },
            ]} submitLabel="Mettre à jour la publication"
            onSubmit={(values) => run(() => socialService.updatePost(id, values), "Publication mise à jour.")} />}
            {id && <Form fields={[{ name: "contenu", label: "Commentaire", required: true }]} submitLabel="Commenter"
              onSubmit={(values) => run(() => socialService.addComment(id, values), "Commentaire ajouté.")} />}
            {id && owned && <Form fields={[{ name: "comment_id", label: "ID du commentaire à supprimer", required: true }]} submitLabel="Supprimer le commentaire"
              onSubmit={(values) => run(() => socialService.deleteComment(String(values.comment_id)), "Commentaire supprimé.")} />}
          </article>
        );
      })}
    </div>
  );
}

function addressCards(
  value: unknown,
  edit: (id: string) => void,
  remove: (id: string) => Promise<void>,
) {
  const addresses = pageItems(value);
  if (!addresses.length) return <p className="muted">Aucune adresse enregistrée.</p>;
  return <div className="entity-list">{addresses.map((address, index) => {
    const record = recordOf(address);
    const id = stringOf(record.id);
    return (
      <article className="entity-card" key={id || index}>
        <h3>{stringOf(record.libelle) || "Adresse"} {record.est_par_defaut ? <span className="badge">Par défaut</span> : null}</h3>
        <p>{stringOf(record.ligne_1)} {stringOf(record.ligne_2)} · {stringOf(record.ville)}</p>
        <p className="muted">{stringOf(record.code_pays)} {stringOf(record.code_postal)}</p>
        {id && <div className="button-row">
          <button className="button secondary" onClick={() => edit(id)} type="button">Modifier</button>
          <ActionButton danger label="Supprimer" onClick={() => remove(id)} />
        </div>}
      </article>
    );
  })}</div>;
}

function entityCards(
  value: unknown,
  hrefFor?: (id: string) => string,
  actionLabel = "Ouvrir",
) {
  const items = pageItems(value);
  if (!items.length) return <p className="muted">Aucune donnée trouvée.</p>;
  return <div className="entity-list">{items.map((item, index) => {
    const record = recordOf(item);
    const id = stringOf(record.id);
    const name = stringOf(record.nom) || stringOf(record.name) || stringOf(record.titre) || stringOf(record.nom_utilisateur) || `Enregistrement ${index + 1}`;
    return (
      <article className="entity-card" key={id || index}>
        <h3>{name}</h3>
        <p className="muted">{stringOf(record.description) || stringOf(record.slug) || stringOf(record.type) || ""}</p>
        {hrefFor && id && <Link className="button secondary" href={hrefFor(id)}>{actionLabel}</Link>}
        {!hrefFor && <DataView value={item} />}
      </article>
    );
  })}</div>;
}

function objectData(value: unknown) {
  return value === null || value === undefined
    ? <p className="muted">Aucune donnée disponible.</p>
    : <DataView value={value} />;
}

function pageItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const record = recordOf(value);
  return Array.isArray(record.data) ? record.data : [];
}

function getPaginatedValue(
  portal: Portal | "client",
  section: string,
  data: DataMap,
  hasResourceId: boolean,
): unknown {
  if (portal === "client") {
    switch (section) {
      case "stores": return hasResourceId ? null : data.stores;
      case "products": return hasResourceId ? null : data.products;
      case "following": return data.users;
      case "orders": return data.orders;
      case "social": return data.feed;
      case "appointments": return data.appointments;
      case "favorites": return data.favoriteProducts;
      case "notifications": return data.notifications;
      case "try-on": return data.sessions;
      default: return null;
    }
  }
  switch (section) {
    case "members": return data.members;
    case "products": return data.listings;
    case "inventory": return data.inventory;
    case "appointments": return data.appointments;
    case "customers": return data.customers;
    case "orders": return data.orders;
    case "transactions": return data.transactions;
    case "activity": return data.activity;
    default: return null;
  }
}

function getPagination(value: unknown): { page: number; totalPages: number; total: number } | null {
  const meta = recordOf(recordOf(value).meta);
  if (typeof meta.page !== "number" || typeof meta.totalPages !== "number") return null;
  return {
    page: meta.page,
    totalPages: meta.totalPages,
    total: typeof meta.total === "number" ? meta.total : 0,
  };
}

function recordOf(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : {};
}

function stringOf(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function messageOf(value: unknown): string {
  return value instanceof Error ? value.message : "La requête a échoué.";
}

function NotAvailable() {
  return <Panel title="Page indisponible"><p>Cette page ne fait pas partie du frontend actuel.</p></Panel>;
}
