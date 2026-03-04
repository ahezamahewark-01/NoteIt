const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const GoogleStrategy = require("passport-google-oauth20");
const session = require("express-session");
const bcrypt = require("bcrypt");
require("dotenv").config();
const { default: MongoStore } = require("connect-mongo");
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const SALT_ROUNDS = 10;

// ── App Config ──────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type"],
  }),
);

//____Session______________________________________________________________________
app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "none",
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

//____Passpost____________________________________________________________________
app.use(passport.initialize());
app.use(passport.session());

// ── Gemini Client ─────────────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function getModel(systemInstruction, temperature = 0.4) {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction,
    generationConfig: {
      temperature,
      maxOutputTokens: 1024,
    },
  });
}

function extractText(result) {
  return result.response.text().trim();
}

// ── MongoDB connection ────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to notesDB"))
  .catch((err) => console.error("❌ DB connection error:", err));

// ── Schemas ────────────────────────────────────────────────────────────────────
const noteSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    content: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);
const Note = mongoose.model("Note", noteSchema);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String },
    googleId: { type: String },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      required: true,
    },
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);

// ── Passport Strategy ─────────────────────────────────────────────────────────
passport.use(
  "local",
  new LocalStrategy(async (username, password, done) => {
    try {
      if (!username || !password) {
        return done(null, false, { message: "Username and password required" });
      }
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: "Invalid username or password" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }),
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({ username: profile.emails[0].value });
        if (!user) {
          const newUser = await User.create({
            username: profile.emails[0].value,
            googleId: profile.id,
            authProvider: "google",
          });
          await createTemplateNote(newUser._id);
          return done(null, newUser);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select("-password");
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// ── Middleware ───────────────────────────────────────────────────────────────────
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: "Unauthorized. Please log in." });
};

//____________ TemplateNote __________________________________________________________
async function createTemplateNote(userId) {
  const templateNote = {
    title: "Try me",
    content: `Welcome to NoteIt 📑
This is a sample note created automatically so you can explore the features of this app without having to write a long note yourself.

Things you can try in this note:
• ✏️ Edit the text and save changes  
• 🧠 Click "Summarize" to generate an AI summary  
• 💬 Ask questions about this note using the AI assistant  
• ✨ Use "Optimize" to improve clarity and writing tone  
• 🗑  Delete the note once you're done exploring  

About AI-powered note tools:
Artificial intelligence is changing how people interact with written information. Instead of reading long documents line by line, users can now generate summaries, extract key insights, and ask contextual questions about their own notes. Tools that combine traditional note-taking with AI capabilities can help users process information faster, improve writing clarity, and better understand complex topics.
In modern productivity workflows, notes are no longer just static pieces of text. They can become interactive knowledge sources where AI helps organize thoughts, summarize important ideas, and answer questions based on the content written by the user.
Machine learning systems analyze patterns in large amounts of data to generate useful predictions and insights. When integrated into productivity tools, these systems can assist users by summarizing lengthy notes, rewriting text to improve readability, and answering questions about stored information. As AI models continue to improve, they are increasingly capable of understanding context, identifying key ideas, and helping users work more efficiently with written content.`,
  };
  await Note.create({
    title: templateNote.title,
    content: templateNote.content,
    userId,
  });
}

// ── Auth Routes ────────────────────────────────────────────────────────────────────
//Check Session
app.get("/check-session", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      success: true,
      user: { id: req.user._id, username: req.user.username },
    });
  }
  return res.status(401).json({ success: false, error: "No active session" });
});

//Singup
app.post(
  "/register",
  asyncHandler(async (req, res, next) => {
    const { username = "", password = "" } = req.body;
    if (!username.trim() || !password.trim()) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res
        .status(409)
        .json({ error: "User already exsist, please login." });
    }
    try {
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const newUser = await User.create({
        username: username.toLowerCase(),
        password: hashedPassword,
        authProvider: "local",
      });
      await createTemplateNote(newUser._id);
      req.login(newUser, (err) => {
        if (err) return next(err);
        return res.status(201).json({
          success: true,
          message: "Registered and logged in successfully",
          user: {
            id: newUser._id,
            username: newUser.username,
          },
        });
      });
    } catch (err) {
      res.status(500).json({
        error: "An internal server error occurred while registration.",
      });
    }
  }),
);

//Login
app.post(
  "/login",
  asyncHandler(async (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: info.message || "Login failed",
        });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.status(200).json({
          success: true,
          message: "Login successful",
          user: {
            id: user._id,
            username: user.username,
          },
        });
      });
    })(req, res, next);
  }),
);

//Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: process.env.CLIENT_URL,
  }),
  (req, res) => {
    res.redirect(process.env.CLIENT_URL);
  },
);

//Logout
app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({ success: true, message: "Logged out." });
  });
});

// ── Notes Routes  ────────────────────────────────────────────────────────────────────
// CREATE
app.post(
  "/notes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title = "", content = "" } = req.body;
    if (!title.trim() && !content.trim()) {
      return res
        .status(400)
        .json({ error: "Note must have a title or content." });
    }
    const note = await Note.create({ title, content, userId: req.user._id });
    res.status(201).json(note);
  }),
);

// READ ALL
app.get(
  "/notes",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.isAuthenticated()) {
      const notes = await Note.find({ userId: req.user._id }).sort({
        createdAt: -1,
      });
      return res.json(notes);
    }
    res.status(401).json({ error: "Unauthorized" });
  }),
);

// READ ONE
app.get(
  "/notes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });
    res.json(note);
  }),
);

// UPDATE
app.put(
  "/notes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { title, content } = req.body;
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { title, content },
      { new: true, runValidators: true },
    );
    if (!note) return res.status(404).json({ error: "Note not found." });
    res.json(note);
  }),
);

// DELETE
app.delete(
  "/notes/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });
    res.json({ message: "Note deleted successfully." });
  }),
);

// ── AI Routes ─────────────────────────────────────────────────────────────────
app.post(
  "/notes/:id/summarize",
  requireAuth,
  asyncHandler(async (req, res) => {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });

    const wordCount = note.content.split(/\s+/).filter(Boolean).length;
    const summaryLength =
      wordCount < 100
        ? "1-2 sentences"
        : wordCount < 300
          ? "3-5 sentences"
          : wordCount < 800
            ? "a short paragraph (5-7 sentences)"
            : "2-3 concise paragraphs";

    const model = getModel(
      `You are an expert note summarizer. Summarize the provided note in ${summaryLength}. ` +
        `Be concise, accurate, and preserve the key points. Return only the summary, no preamble.`,
    );

    const result = await model.generateContent(
      `Title: ${note.title}\n\nContent:\n${note.content}`,
    );

    res.json({ summary: extractText(result) });
  }),
);

app.post(
  "/notes/:id/ask",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { question, conversationHistory = [] } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ error: "Question is required." });
    }

    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });

    const model = getModel(
      `You are a helpful assistant. The user is asking questions about the following note.\n` +
        `Answer based ONLY on the note content. If the answer isn't in the note, say so clearly.\n\n` +
        `--- NOTE ---\n` +
        `Title: ${note.title}\n` +
        `Content:\n${note.content}\n` +
        `--- END NOTE ---`,
      0.5,
    );

    const geminiHistory = conversationHistory
      .slice(-10)
      .map(({ role, content }) => ({
        role: role === "assistant" ? "model" : "user",
        parts: [{ text: content }],
      }));
    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(question);
    res.json({ answer: extractText(result) });
  }),
);

app.post(
  "/notes/:id/optimize",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { instruction = "improve clarity and tone" } = req.body;
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!note) return res.status(404).json({ error: "Note not found." });
    const model = getModel(
      "You are a writing assistant. Rewrite the given note according to the user's instruction. " +
        "Preserve all factual information. Return ONLY the rewritten content (no title, no preamble).",
      0.6,
    );

    const result = await model.generateContent(
      `Instruction: ${instruction}\n\n` +
        `Title: ${note.title}\n\n` +
        `Content:\n${note.content}`,
    );
    res.json({ optimized: extractText(result) });
  }),
);

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  const status = err.status || err.httpStatusCode || 500;
  const message =
    err.message || err.errorDetails?.[0]?.reason || "Internal server error.";
  res.status(status).json({ error: message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
