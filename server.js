const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

// =====================================================
// CONFIGURATION GÉNÉRALE
// =====================================================

app.use(cors());
app.use(express.json());

// =====================================================
// STOCKAGE TEMPORAIRE DES COMMANDES
// =====================================================
//
// Pour cette première étape, nous utilisons la mémoire
// du serveur afin de construire et tester l'API.
//
// Aucune simulation de recharge n'est effectuée.
// Une vraie base de données pourra remplacer cette partie.
//

const orders = [];

let nextOrderId = 1;

// =====================================================
// CONFIGURATION DES RÉSEAUX
// =====================================================

const NETWORKS = {
    vodacom: {
        name: "Vodacom"
    },

    airtel: {
        name: "Airtel"
    },

    orange: {
        name: "Orange"
    },

    africell: {
        name: "Africell"
    }
};

// =====================================================
// CONSTRUCTION DE LA CHAÎNE USSD
// =====================================================
//
// IMPORTANT : les vrais codes USSD opérateurs ne sont
// volontairement PAS inventés ici.
//
// Ils devront être renseignés dans cette configuration
// lorsque les formats réels et autorisés seront définis.
//

const USSD_CONFIG = {
    vodacom: {
       
    credit: {
        // Format réel d'achat de crédit Vodacom Voda-E.
        // Le PIN est injecté depuis la variable d'environnement.
        code: "*1117*01*{PIN}*{NUMERO}*{UNITES}#"
    },

       
    internet: {
        // Achat réel de forfaits Internet Vodacom Voda-E.
        // Le PIN est lu depuis la variable d'environnement.
        code: "*1117*17*{PIN}*{NUMERO}*{UNITES}#"
    }

    },

    airtel: {
        credit: {
            code: null
        },

        internet: {
            code: null
        }
    },

    orange: {
        credit: {
            code: null
        },

        internet: {
            code: null
        }
    },

    africell: {
        credit: {
            code: null
        },

        internet: {
            code: null
        }
    }
};

// =====================================================
// FONCTION DE CONSTRUCTION USSD
// =====================================================

function buildUSSD(network, type, phone, amount) {

    const networkConfig = USSD_CONFIG[network];

    if (!networkConfig) {
        throw new Error(`Réseau non configuré : ${network}`);
    }

    const typeConfig = networkConfig[type];

    if (!typeConfig) {
        throw new Error(
            `Type de rechargement non configuré : ${type}`
        );
    }

    if (!typeConfig.code) {
        throw new Error(
            `Code USSD non configuré pour ${network} / ${type}`
        );
    }

 
if (typeConfig.direct === true) {
    return typeConfig.code;
}

// Traitement spécifique à Vodacom crédit et Internet.
if (
    network === "vodacom" &&
    (type === "credit" || type === "internet")
) {
    const pin = process.env.VODA_E_PIN;

    if (!pin || !/^\d+$/.test(pin)) {
        throw new Error(
            "PIN Voda-E absent ou invalide. Vérifiez VODA_E_PIN dans le fichier .env."
        );
    }

    const numero = String(phone).trim();
    const unites = String(amount).trim();

    if (!numero || !unites) {
        throw new Error(
            "Le numéro bénéficiaire et les unités sont obligatoires."
        );
    }

    return typeConfig.code
        .replace("{PIN}", pin)
        .replace("{NUMERO}", numero)
        .replace("{UNITES}", unites);
}

// Construction générique conservée pour les autres cas.
return `${typeConfig.code}${phone}*${amount}#`;

}

// =====================================================
// POST /api/orders
// =====================================================
//
// Reçoit une commande provenant de Mercato Web.
//

app.post("/api/orders", (req, res) => {

    console.log("\n=========================================");
    console.log("[API] Nouvelle commande reçue");
    console.log("=========================================");

    try {

        const {
            phone,
            amount,
            network,
            offerId
        } = req.body;

        console.log("[API] Données reçues :", req.body);

        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        console.log("[VALIDATION] Vérification des données...");

        if (!phone) {
            console.error("[ERREUR] Numéro à recharger manquant.");

            return res.status(400).json({
                success: false,
                message: "Le numéro à recharger est obligatoire."
            });
        }

        if (!amount) {
            console.error("[ERREUR] Montant manquant.");

            return res.status(400).json({
                success: false,
                message: "Le montant est obligatoire."
            });
        }

        if (!network) {
            console.error("[ERREUR] Réseau manquant.");

            return res.status(400).json({
                success: false,
                message: "Le réseau est obligatoire."
            });
        }

        if (!offerId) {
            console.error("[ERREUR] Offre manquante.");

            return res.status(400).json({
                success: false,
                message: "L'offre est obligatoire."
            });
        }

        if (!NETWORKS[network]) {
            console.error(`[ERREUR] Réseau non reconnu : ${network}`);

            return res.status(400).json({
                success: false,
                message: "Réseau non reconnu."
            });
        }

        console.log("[VALIDATION] Données valides.");

        // -------------------------------------------------
        // CONSTRUCTION DE LA CHAÎNE USSD
        // -------------------------------------------------

        console.log("[USSD] Construction de la commande USSD...");

        let ussd;

        try {

            /*
             * Pour l'instant, le serveur refuse de fabriquer
             * une fausse commande si le véritable code USSD
             * n'est pas configuré.
             */

            ussd = buildUSSD(
                network,
                req.body.type,
                phone,
                amount
            );

            console.log(`[USSD] Commande USSD générée : ${ussd}`);

        } catch (error) {

            console.error(
                `[USSD] Échec de construction : ${error.message}`
            );

            return res.status(501).json({
                success: false,
                message: error.message
            });
        }

        // -------------------------------------------------
        // CRÉATION DE LA COMMANDE
        // -------------------------------------------------

        console.log("[ORDER] Création de la commande...");

        const order = {
            id: nextOrderId++,

            phone,
            amount,
            network,
            offerId,
            type: req.body.type,

            ussd,

            status: "pending",

            createdAt: new Date().toISOString(),

            thor: {
                received: false,
                executed: false
            }
        };

        orders.push(order);

        console.log(`[ORDER] Commande #${order.id} créée.`);
        console.log(`[ORDER] Réseau : ${network}`);
        console.log(`[ORDER] Type : ${req.body.type}`);
        console.log(`[ORDER] Numéro : ${phone}`);
        console.log(`[ORDER] Montant : ${amount}`);
        console.log(`[ORDER] USSD : ${ussd}`);
        console.log(`[ORDER] Statut : ${order.status}`);

        console.log(
            `[API] Commande #${order.id} transmise au système Mercato.`
        );

        // -------------------------------------------------
        // RÉPONSE AU FRONTEND
        // -------------------------------------------------

        return res.status(201).json({
            success: true,

            message: "Commande créée avec succès.",

            order: {
                id: order.id,
                status: order.status
            }
        });

    } catch (error) {

        console.error(
            "[ERREUR] Erreur POST /api/orders :",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Erreur interne du serveur."
        });
    }
});

// =====================================================
// GET /api/orders
// =====================================================
//
// Permet de consulter toutes les commandes au format JSON.
//

app.get("/api/orders", (req, res) => {

    console.log("[API] Consultation de toutes les commandes.");

    console.log(
        `[API] Nombre total de commandes : ${orders.length}`
    );

    return res.json({
        success: true,
        count: orders.length,
        orders: orders
    });
});

// =====================================================
// GET /api/thor/orders
// =====================================================
//
// Thor appelle cette route pour récupérer les commandes
// qui doivent être exécutées.
//

app.get("/api/thor/orders", (req, res) => {

    console.log("\n[THOR] Demande de récupération des commandes.");

    const pendingOrders = orders.filter(
        order =>
            order.status === "pending" &&
            order.thor.received === false
    );

    console.log(
        `[THOR] ${pendingOrders.length} commande(s) en attente trouvée(s).`
    );

    pendingOrders.forEach(order => {

        order.thor.received = true;
        order.status = "processing";

        console.log(
            `[THOR] Commande #${order.id} transmise à Thor.`
        );

        console.log(
            `[THOR] USSD commande #${order.id} : ${order.ussd}`
        );

        console.log(
            `[THOR] Statut commande #${order.id} → processing`
        );
    });

    return res.json({
        success: true,
        count: pendingOrders.length,
        orders: pendingOrders
    });
});

// =====================================================
// POST /api/thor/result
// =====================================================
//
// Thor renvoie ici le résultat de l'exécution.
//

app.post("/api/thor/result", (req, res) => {

    console.log("\n[THOR] Nouveau résultat reçu.");

    const {
        orderId,
        success,
        message
    } = req.body;

    console.log("[THOR] Données reçues :", req.body);

    if (!orderId) {

        console.error("[THOR] orderId manquant.");

        return res.status(400).json({
            success: false,
            message: "orderId obligatoire."
        });
    }

    const order = orders.find(
        item => item.id === Number(orderId)
    );

    if (!order) {

        console.error(
            `[THOR] Commande #${orderId} introuvable.`
        );

        return res.status(404).json({
            success: false,
            message: "Commande introuvable."
        });
    }

    order.thor.executed = true;

    if (success === true) {

        order.status = "completed";

        console.log(
            `[THOR] Exécution commande #${order.id} : SUCCÈS`
        );

    } else {

        order.status = "failed";

        console.error(
            `[THOR] Exécution commande #${order.id} : ÉCHEC`
        );
    }

    order.result = {
        success: Boolean(success),
        message: message || null,
        receivedAt: new Date().toISOString()
    };

    console.log(
        `[THOR] Message : ${message || "Aucun message"}`
    );

    console.log(
        `[ORDER] Commande #${order.id} → ${order.status}`
    );

    return res.json({
        success: true,
        message: "Résultat Thor enregistré.",
        orderId: order.id,
        status: order.status
    });
});

// =====================================================
// GET /api/orders/:id
// =====================================================
//
// Permet au frontend de consulter l'état d'une commande.
//

app.get("/api/orders/:id", (req, res) => {

    console.log(
        `[API] Consultation de la commande #${req.params.id}`
    );

    const order = orders.find(
        item => item.id === Number(req.params.id)
    );

    if (!order) {

        console.error(
            `[API] Commande #${req.params.id} introuvable.`
        );

        return res.status(404).json({
            success: false,
            message: "Commande introuvable."
        });
    }

    console.log(
        `[API] Commande #${order.id} trouvée. Statut : ${order.status}`
    );

    return res.json({
        success: true,
        order
    });
});

// =====================================================
// ROUTE DE TEST DU SERVEUR
// =====================================================

app.get("/api/health", (req, res) => {

    console.log("[HEALTH] Vérification du serveur.");

    res.json({
        success: true,
        service: "Mercato Backend API",
        status: "online"
    });
});

// =====================================================
// DÉMARRAGE DU SERVEUR
// =====================================================

app.listen(PORT, () => {

    console.log(`
=========================================
 MERCATO BACKEND API
=========================================

Serveur : http://localhost:${PORT}

API :
POST /api/orders
GET  /api/orders
GET  /api/thor/orders
POST /api/thor/result
GET  /api/orders/:id
GET  /api/health

=========================================
Serveur démarré avec succès.
En attente de commandes...
=========================================
`);
});