const {onRequest} = require("firebase-functions/v2/https");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors");
const express = require("express");

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Create Express app
const app = express();

// Configure CORS
app.use(cors({origin: true}));
app.use(express.json());

// ============ AUTHENTICATION MIDDLEWARE ============

const authenticateUser = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Token de autorização necessário",
      });
    }

    const token = authorization.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    next();
  } catch (error) {
    logger.error("Erro na autenticação:", error);
    return res.status(401).json({
      success: false,
      message: "Token inválido",
    });
  }
};

// ============ ROUTES ============

// Horários (não protegida)
app.get("/horarios", (req, res) => {
  const horarios = [
    {id: 1, inicio: "19:20", fim: "20:50"},
    {id: 2, inicio: "21:10", fim: "22:40"},
  ];
  res.json(horarios);
});

// Disciplinas do usuário
app.get("/disciplinas", authenticateUser, async (req, res) => {
  try {
    const disciplinasRef = db.collection("disciplinas");
    const query = disciplinasRef
        .where("usuarioId", "==", req.userId)
        .orderBy("nome");

    const snapshot = await query.get();
    const disciplinas = [];

    snapshot.forEach((doc) => {
      disciplinas.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.json(disciplinas);
  } catch (error) {
    logger.error("Erro ao buscar disciplinas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar disciplinas",
    });
  }
});

// Criar disciplina
app.post("/disciplinas", authenticateUser, async (req, res) => {
  try {
    const {nome, codigo} = req.body;

    if (!nome || !codigo) {
      return res.status(400).json({
        success: false,
        error: "Nome e código são obrigatórios",
      });
    }

    // Verificar se o código já existe para este usuário
    const existingQuery = await db.collection("disciplinas")
        .where("usuarioId", "==", req.userId)
        .where("codigo", "==", codigo)
        .get();

    if (!existingQuery.empty) {
      return res.status(409).json({
        success: false,
        error: "Código da disciplina já existe",
      });
    }

    // Gerar cor aleatória
    const cores = ["#1e40af", "#dc2626", "#059669", "#7c3aed", "#ea580c", "#0891b2"];
    const cor = cores[Math.floor(Math.random() * cores.length)];

    const disciplinaData = {
      nome,
      codigo,
      cor,
      usuarioId: req.userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("disciplinas").add(disciplinaData);

    res.status(201).json({
      success: true,
      message: "Disciplina criada com sucesso",
      data: {
        id: docRef.id,
        ...disciplinaData,
      },
    });
  } catch (error) {
    logger.error("Erro ao criar disciplina:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Aulas do usuário
app.get("/aulas", authenticateUser, async (req, res) => {
  try {
    const aulasRef = db.collection("aulas");
    const query = aulasRef
        .where("usuarioId", "==", req.userId)
        .orderBy("dataHora");

    const snapshot = await query.get();
    const aulas = [];

    // Buscar dados das disciplinas relacionadas
    for (const doc of snapshot.docs) {
      const aulaData = doc.data();

      if (aulaData.disciplinaId) {
        try {
          const disciplinaDoc = await db.collection("disciplinas")
              .doc(aulaData.disciplinaId).get();

          if (disciplinaDoc.exists) {
            const disciplinaData = disciplinaDoc.data();
            aulaData.disciplina_nome = disciplinaData.nome;
            aulaData.disciplina_cor = disciplinaData.cor;
          }
        } catch (error) {
          logger.warn("Erro ao buscar disciplina:", error);
        }
      }

      aulas.push({
        id: doc.id,
        ...aulaData,
      });
    }

    res.json(aulas);
  } catch (error) {
    logger.error("Erro ao buscar aulas:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar aulas",
    });
  }
});

// Criar aula
app.post("/aulas", authenticateUser, async (req, res) => {
  try {
    const {titulo, descricao, dataHora, duracao, laboratorio, disciplinaId} = req.body;

    if (!titulo || !dataHora || !duracao || !laboratorio || !disciplinaId) {
      return res.status(400).json({
        success: false,
        error: "Campos obrigatórios: titulo, dataHora, duracao, laboratorio, disciplinaId",
      });
    }

    const aulaData = {
      titulo,
      descricao,
      dataHora,
      duracao,
      laboratorio,
      disciplinaId,
      usuarioId: req.userId,
      status: "agendada",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("aulas").add(aulaData);

    res.status(201).json({
      success: true,
      message: "Aula criada com sucesso",
      data: {
        id: docRef.id,
        ...aulaData,
      },
    });
  } catch (error) {
    logger.error("Erro ao criar aula:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Atualizar status da aula
app.patch("/aulas/:id/status", authenticateUser, async (req, res) => {
  try {
    const {id} = req.params;
    const {status} = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status é obrigatório",
      });
    }

    // Verificar se a aula pertence ao usuário
    const aulaDoc = await db.collection("aulas").doc(id).get();

    if (!aulaDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Aula não encontrada",
      });
    }

    const aulaData = aulaDoc.data();
    if (aulaData.usuarioId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado",
      });
    }

    // Atualizar status
    await db.collection("aulas").doc(id).update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: "Status da aula atualizado com sucesso",
    });
  } catch (error) {
    logger.error("Erro ao atualizar status da aula:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor",
    });
  }
});

// Verificar token (para compatibilidade)
app.get("/auth/verify", authenticateUser, async (req, res) => {
  try {
    // Buscar dados do usuário no Firestore
    const userDoc = await db.collection("usuarios").doc(req.userId).get();
    let userData = {};

    if (userDoc.exists) {
      userData = userDoc.data();
    }

    res.json({
      success: true,
      message: "Token válido",
      data: {
        usuario: {
          id: req.userId,
          usuario: userData.usuario || req.user.name || req.user.email,
          laboratorio: userData.laboratorio,
          email: req.user.email,
        },
      },
    });
  } catch (error) {
    logger.error("Erro ao verificar token:", error);
    res.status(500).json({
      success: false,
      message: "Erro interno do servidor",
    });
  }
});

// Export the Express app as a Firebase Function
exports.api = onRequest(app);