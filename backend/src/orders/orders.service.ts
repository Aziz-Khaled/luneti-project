import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  StatutAnnonce,
  StatutCommande,
  StatutMagasin,
  StatutPanier,
} from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto, paginated } from '../common/dto/pagination.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpsertCartItemDto } from './dto/upsert-cart-item.dto';

const orderSelect = {
  id: true,
  numero_commande: true,
  magasin_id: true,
  statut: true,
  devise: true,
  sous_total: true,
  total_remise: true,
  total_taxes: true,
  total_livraison: true,
  total_general: true,
  note_client: true,
  passee_le: true,
  terminee_le: true,
  annulee_le: true,
  cree_le: true,
  articles: {
    select: {
      id: true,
      instantane_nom_produit: true,
      instantane_variante: true,
      instantane_reference: true,
      quantite: true,
      prix_unitaire: true,
      montant_remise: true,
      total_ligne: true,
    },
  },
} satisfies Prisma.CommandeSelect;

const cartSelect = {
  id: true,
  statut: true,
  modifie_le: true,
  articles: {
    select: {
      id: true,
      quantite: true,
      variante_annonce: {
        select: {
          id: true,
          prix: true,
          devise: true,
          est_disponible: true,
          annonce: {
            select: {
              id: true,
              statut: true,
              magasin_id: true,
              magasin: { select: { nom: true, statut: true } },
              produit: { select: { nom: true } },
            },
          },
          variante: { select: { id: true, variantName: true, couleur: true, taille: true } },
          stocks: {
            where: { location: { est_actif: true } },
            select: { quantite_disponible: true, quantite_reservee: true },
          },
        },
      },
    },
  },
} satisfies Prisma.PanierSelect;

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async getCart(userId: string) {
    const cart = await this.getOrCreateActiveCart(userId);
    const result = await this.prisma.panier.findUniqueOrThrow({
      where: { id: cart.id },
      select: cartSelect,
    });
    return {
      ...result,
      articles: result.articles.map((item) => ({
        ...item,
        stock_disponible: item.variante_annonce.stocks.reduce(
          (sum, stock) =>
            sum + stock.quantite_disponible - stock.quantite_reservee,
          0,
        ),
      })),
    };
  }

  async upsertCartItem(userId: string, input: UpsertCartItemDto) {
    const variant = await this.prisma.varianteAnnonceMagasin.findFirst({
      where: {
        id: input.variante_annonce_id,
        est_disponible: true,
        annonce: {
          statut: StatutAnnonce.ACTIVE,
          supprime_le: null,
          magasin: { statut: StatutMagasin.ACTIVE, supprime_le: null },
        },
      },
      select: {
        id: true,
        annonce: { select: { magasin_id: true } },
        stocks: {
          where: { location: { est_actif: true } },
          select: { quantite_disponible: true, quantite_reservee: true },
        },
      },
    });
    if (!variant) throw new NotFoundException('Active listing variant not found');
    const available = variant.stocks.reduce(
      (sum, stock) => sum + stock.quantite_disponible - stock.quantite_reservee,
      0,
    );
    if (available < input.quantite) {
      throw new ConflictException('Requested quantity exceeds available stock');
    }

    const cart = await this.getOrCreateActiveCart(userId);
    const existing = await this.prisma.articlePanier.findFirst({
      where: {
        panier_id: cart.id,
        variante_annonce_id: variant.id,
      },
      select: { id: true },
    });
    if (existing) {
      return this.prisma.articlePanier.update({
        where: { id: existing.id },
        data: { quantite: input.quantite },
        select: { id: true, quantite: true, variante_annonce_id: true },
      });
    }
    return this.prisma.articlePanier.create({
      data: {
        panier_id: cart.id,
        variante_annonce_id: variant.id,
        quantite: input.quantite,
      },
      select: { id: true, quantite: true, variante_annonce_id: true },
    });
  }

  async removeCartItem(userId: string, itemId: string) {
    const result = await this.prisma.articlePanier.deleteMany({
      where: { id: itemId, cart: { utilisateur_id: userId, statut: StatutPanier.ACTIVE } },
    });
    if (!result.count) throw new NotFoundException('Cart item not found');
    return { success: true };
  }

  async clearCart(userId: string) {
    const cart = await this.prisma.panier.findFirst({
      where: { utilisateur_id: userId, statut: StatutPanier.ACTIVE },
      select: { id: true },
      orderBy: { cree_le: 'desc' },
    });
    if (!cart) return { success: true };
    await this.prisma.$transaction([
      this.prisma.articlePanier.deleteMany({ where: { panier_id: cart.id } }),
      this.prisma.panier.update({
        where: { id: cart.id },
        data: { statut: StatutPanier.ABANDONNE },
      }),
    ]);
    return { success: true };
  }

  async createOrder(userId: string, input: CreateOrderDto) {
    const cart = await this.prisma.panier.findFirst({
      where: { utilisateur_id: userId, statut: StatutPanier.ACTIVE },
      select: {
        id: true,
        articles: {
          select: {
            quantite: true,
            variante_annonce: {
              select: {
                id: true,
                prix: true,
                devise: true,
                reference_magasin: true,
                est_disponible: true,
                annonce: {
                  select: {
                    magasin_id: true,
                    statut: true,
                    supprime_le: true,
                    magasin: { select: { nom: true, statut: true, supprime_le: true } },
                    produit: { select: { nom: true, statut: true, supprime_le: true } },
                  },
                },
                variante: {
                  select: {
                    id: true,
                    variantName: true,
                    couleur: true,
                    taille: true,
                    reference_globale: true,
                    est_actif: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!cart || cart.articles.length === 0) {
      throw new BadRequestException('The active cart is empty');
    }
    const storeId = cart.articles[0].variante_annonce.annonce.magasin_id;
    if (cart.articles.some((item) => item.variante_annonce.annonce.magasin_id !== storeId)) {
      throw new BadRequestException('A cart order can contain products from only one store');
    }
    for (const item of cart.articles) {
      const listing = item.variante_annonce;
      if (
        !listing.est_disponible ||
        listing.annonce.statut !== StatutAnnonce.ACTIVE ||
        listing.annonce.supprime_le ||
        listing.annonce.magasin.statut !== StatutMagasin.ACTIVE ||
        listing.annonce.magasin.supprime_le ||
        listing.annonce.produit.statut !== 'ACTIVE' ||
        listing.annonce.produit.supprime_le ||
        !listing.variante.est_actif
      ) {
        throw new ConflictException('A cart item is no longer available');
      }
    }
    const currency = cart.articles[0].variante_annonce.devise;
    if (cart.articles.some((item) => item.variante_annonce.devise !== currency)) {
      throw new ConflictException('Cart items use inconsistent currencies');
    }
    const billingAddress = input.adresse_facturation_id
      ? await this.ownedAddress(userId, input.adresse_facturation_id)
      : null;
    const shippingAddress = input.adresse_livraison_id
      ? await this.ownedAddress(userId, input.adresse_livraison_id)
      : null;
    const subtotal = cart.articles.reduce(
      (sum, item) =>
        sum.add(item.variante_annonce.prix.mul(item.quantite)),
      new Prisma.Decimal(0),
    );
    const orderNumber = `LUN-${randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.commande.create({
        data: {
          numero_commande: orderNumber,
          utilisateur_id: userId,
          magasin_id: storeId,
          devise: currency,
          sous_total: subtotal,
          total_general: subtotal,
          note_client: input.note_client,
          instantane_adresse_facturation: billingAddress
            ? this.addressSnapshot(billingAddress)
            : Prisma.JsonNull,
          instantane_adresse_livraison: shippingAddress
            ? this.addressSnapshot(shippingAddress)
            : Prisma.JsonNull,
          passee_le: new Date(),
          articles: {
            create: cart.articles.map((item) => ({
              variante_annonce_id: item.variante_annonce.id,
              instantane_nom_produit: item.variante_annonce.annonce.produit.nom,
              instantane_variante: {
                id: item.variante_annonce.variante.id,
                name: item.variante_annonce.variante.variantName,
                color: item.variante_annonce.variante.couleur,
                size: item.variante_annonce.variante.taille,
              },
              instantane_reference:
                item.variante_annonce.reference_magasin ??
                item.variante_annonce.variante.reference_globale,
              quantite: item.quantite,
              prix_unitaire: item.variante_annonce.prix,
              total_ligne: item.variante_annonce.prix.mul(item.quantite),
            })),
          },
          historique_statuts: {
            create: {
              statut_precedent: null,
              statut_suivant: StatutCommande.EN_ATTENTE_PAIEMENT,
              modifie_par_id: userId,
            },
          },
        },
        select: orderSelect,
      });

      for (const item of cart.articles) {
        await this.reserveStock(
          tx,
          storeId,
          item.variante_annonce.id,
          item.quantite,
          userId,
          orderNumber,
        );
      }
      await this.audit.record(tx, {
        storeId,
        actorId: userId,
        action: 'order.created',
        entityType: 'order',
        entityId: order.id,
        description: `Order ${orderNumber} created`,
        after: {
          orderNumber,
          status: order.statut,
          total: order.total_general.toString(),
          currency: order.devise,
        },
      });
      await tx.panier.update({
        where: { id: cart.id },
        data: { statut: StatutPanier.CONVERTI },
      });
      return order;
    });
  }

  async listOrders(userId: string, pagination: PaginationDto) {
    const where = { utilisateur_id: userId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.commande.findMany({
        where,
        select: orderSelect,
        orderBy: { cree_le: 'desc' },
        skip: pagination.skip,
        take: pagination.limit,
      }),
      this.prisma.commande.count({ where }),
    ]);
    return paginated(data, total, pagination.page, pagination.limit);
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.commande.findFirst({
      where: { id: orderId, utilisateur_id: userId },
      select: orderSelect,
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async getOrderHistory(userId: string, orderId: string) {
    await this.assertOwnedOrder(userId, orderId);
    return this.prisma.historiqueStatutCommande.findMany({
      where: { commande_id: orderId },
      select: {
        id: true,
        statut_precedent: true,
        statut_suivant: true,
        note: true,
        cree_le: true,
      },
      orderBy: { cree_le: 'asc' },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.commande.findFirst({
        where: { id: orderId, utilisateur_id: userId },
        select: { id: true, statut: true, numero_commande: true },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (order.statut !== StatutCommande.EN_ATTENTE_PAIEMENT) {
        throw new ConflictException('Only unpaid orders can be cancelled by the customer');
      }
      await this.releaseOrderReservations(tx, order.numero_commande, userId);
      const updated = await tx.commande.update({
        where: { id: order.id },
        data: {
          statut: StatutCommande.ANNULE,
          annulee_le: new Date(),
          historique_statuts: {
            create: {
              statut_precedent: order.statut,
              statut_suivant: StatutCommande.ANNULE,
              modifie_par_id: userId,
            },
          },
        },
        select: orderSelect,
      });
      return updated;
    });
  }

  private async getOrCreateActiveCart(userId: string) {
    const existing = await this.prisma.panier.findFirst({
      where: { utilisateur_id: userId, statut: StatutPanier.ACTIVE },
      select: { id: true },
      orderBy: { cree_le: 'desc' },
    });
    if (existing) return existing;
    return this.prisma.panier.create({
      data: { utilisateur_id: userId },
      select: { id: true },
    });
  }

  private async ownedAddress(userId: string, addressId: string) {
    const address = await this.prisma.adresse.findFirst({
      where: { id: addressId, utilisateur_id: userId },
      select: {
        nom_destinataire: true,
        telephone: true,
        ligne_1: true,
        ligne_2: true,
        ville: true,
        region: true,
        code_postal: true,
        code_pays: true,
      },
    });
    if (!address) throw new BadRequestException('Order address must belong to the authenticated user');
    return address;
  }

  private addressSnapshot(address: NonNullable<Awaited<ReturnType<OrdersService['ownedAddress']>>>) {
    return {
      ...(address.nom_destinataire ? { recipient: address.nom_destinataire } : {}),
      ...(address.telephone ? { phone: address.telephone } : {}),
      line1: address.ligne_1,
      ...(address.ligne_2 ? { line2: address.ligne_2 } : {}),
      city: address.ville,
      ...(address.region ? { region: address.region } : {}),
      ...(address.code_postal ? { postalCode: address.code_postal } : {}),
      country: address.code_pays,
    };
  }

  private async reserveStock(
    tx: Prisma.TransactionClient,
    storeId: string,
    listingVariantId: string,
    quantity: number,
    userId: string,
    orderNumber: string,
  ) {
    const stocks = await tx.stock.findMany({
      where: {
        storeListingVariantId: listingVariantId,
        location: { magasin_id: storeId, est_actif: true },
      },
      orderBy: { id: 'asc' },
      select: { id: true, quantite_disponible: true, quantite_reservee: true },
    });
    let remaining = quantity;
    for (const stock of stocks) {
      const free = stock.quantite_disponible - stock.quantite_reservee;
      const reserve = Math.min(free, remaining);
      if (reserve <= 0) continue;
      const updated = await tx.stock.updateMany({
        where: {
          id: stock.id,
          quantite_disponible: stock.quantite_disponible,
          quantite_reservee: stock.quantite_reservee,
        },
        data: { quantite_reservee: { increment: reserve } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Inventory changed during checkout; retry');
      }
      await tx.mouvementStock.create({
        data: {
          stock_id: stock.id,
          acteur_id: userId,
          type: 'RESERVE',
          quantite: reserve,
          quantite_precedente: stock.quantite_disponible,
          quantite_suivante: stock.quantite_disponible,
          reserve_precedente: stock.quantite_reservee,
          reserve_suivante: stock.quantite_reservee + reserve,
          reference: orderNumber,
          note: 'Order stock reservation',
        },
      });
      remaining -= reserve;
      if (remaining === 0) break;
    }
    if (remaining > 0) throw new ConflictException('Insufficient stock to place order');
  }

  private async releaseOrderReservations(
    tx: Prisma.TransactionClient,
    orderNumber: string,
    userId: string,
  ) {
    const movements = await tx.mouvementStock.findMany({
      where: {
        reference: orderNumber,
        type: 'RESERVE',
      },
      select: { stock_id: true, quantite: true },
    });
    for (const movement of movements) {
      const stock = await tx.stock.findUnique({
        where: { id: movement.stock_id },
        select: {
          id: true,
          quantite_disponible: true,
          quantite_reservee: true,
        },
      });
      if (!stock || stock.quantite_reservee < movement.quantite) {
        throw new ConflictException('Order reservation is inconsistent; contact support');
      }
      const updated = await tx.stock.updateMany({
        where: {
          id: stock.id,
          quantite_disponible: stock.quantite_disponible,
          quantite_reservee: stock.quantite_reservee,
        },
        data: { quantite_reservee: { decrement: movement.quantite } },
      });
      if (updated.count !== 1) {
        throw new ConflictException('Order reservation changed concurrently; retry');
      }
      await tx.mouvementStock.create({
        data: {
          stock_id: stock.id,
          acteur_id: userId,
          type: 'LIBERE',
          quantite: movement.quantite,
          quantite_precedente: stock.quantite_disponible,
          quantite_suivante: stock.quantite_disponible,
          reserve_precedente: stock.quantite_reservee,
          reserve_suivante: stock.quantite_reservee - movement.quantite,
          reference: orderNumber,
          note: 'Order cancellation reservation release',
        },
      });
    }
  }

  private async assertOwnedOrder(userId: string, orderId: string) {
    const order = await this.prisma.commande.findFirst({
      where: { id: orderId, utilisateur_id: userId },
      select: { id: true },
    });
    if (!order) throw new NotFoundException('Order not found');
  }
}
