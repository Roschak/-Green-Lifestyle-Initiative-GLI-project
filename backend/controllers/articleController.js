const db = require('../config/db');

// Create new article
exports.createArticle = async (req, res) => {
  try {
    const { title, description, content, category, featured } = req.body;
    const userId = req.user.id;
    const userName = req.user.name;

    // Validation
    if (!title || !description || !content || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, content, dan category harus diisi'
      });
    }

    const article = {
      title,
      description,
      content,
      category,
      featured: featured || false,
      status: 'published',
      author_id: userId,
      author_name: userName,
      image: req.file ? req.file.secure_url : '/images/default-article.png',
      views: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Only add thumbnail if file is uploaded
    if (req.file) {
      article.thumbnail = req.file.secure_url;
    }

    // Add to Firestore
    const docRef = await db.collection('articles').add(article);

    res.status(201).json({
      success: true,
      message: 'Artikel berhasil dibuat',
      article: { id: docRef.id, ...article }
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error membuat artikel'
    });
  }
};

// Get all articles
exports.getAllArticles = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;

    let query = db.collection('articles').where('status', '==', 'published');

    if (category && category !== 'all') {
      query = query.where('category', '==', category);
    }

    // Get all matching documents (without orderBy to avoid index requirement)
    const snapshot = await query.get();
    const allArticles = [];

    snapshot.forEach(doc => {
      allArticles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort in memory
    allArticles.sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at);
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at);
      return dateB - dateA;
    });

    // Paginate
    const total = allArticles.length;
    const startIndex = (page - 1) * limit;
    const paginatedArticles = allArticles.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      articles: paginatedArticles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengambil artikel'
    });
  }
};

// Get single article
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection('articles').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    const article = doc.data();

    // Increment views
    await db.collection('articles').doc(id).update({
      views: (article.views || 0) + 1
    });

    res.json({
      success: true,
      article: { id, ...article }
    });
  } catch (error) {
    console.error('Error getting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengambil artikel'
    });
  }
};

// Update article
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, category, featured, status } = req.body;
    const userId = req.user.id;

    // Check if article exists
    const doc = await db.collection('articles').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    const article = doc.data();

    // Check authorization (only creator or admin can edit)
    if (article.author_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk edit artikel ini'
      });
    }

    const updateData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(content && { content }),
      ...(category && { category }),
      ...(featured !== undefined && { featured }),
      ...(status && { status }),
      ...(req.file && { image: req.file.secure_url, thumbnail: req.file.secure_url }),
      updated_at: new Date()
    };

    await db.collection('articles').doc(id).update(updateData);

    res.json({
      success: true,
      message: 'Artikel berhasil diupdate',
      article: { id, ...article, ...updateData }
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengupdate artikel'
    });
  }
};

// Delete article
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if article exists
    const doc = await db.collection('articles').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Artikel tidak ditemukan'
      });
    }

    const article = doc.data();

    // Check authorization (only creator or admin can delete)
    if (article.author_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk hapus artikel ini'
      });
    }

    // Delete article
    await db.collection('articles').doc(id).delete();

    res.json({
      success: true,
      message: 'Artikel berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error menghapus artikel'
    });
  }
};

// Get admin articles (all including drafts)
exports.getAdminArticles = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Get total count
    const countSnapshot = await db.collection('articles').get();
    const total = countSnapshot.size;

    // Paginate
    const startIndex = (page - 1) * limit;
    const snapshot = await db.collection('articles')
      .orderBy('created_at', 'desc')
      .limit(parseInt(limit))
      .offset(startIndex)
      .get();

    const articles = [];
    snapshot.forEach(doc => {
      articles.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      articles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting admin articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengambil artikel'
    });
  }
};

// Publish/Draft toggle
exports.toggleArticleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'draft'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus published atau draft'
      });
    }

    await db.collection('articles').doc(id).update({
      status,
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: `Artikel berhasil di-${status === 'published' ? 'publikasikan' : 'simpan sebagai draft'}`
    });
  } catch (error) {
    console.error('Error toggling article status:', error);
    res.status(500).json({
      success: false,
      message: 'Error mengubah status artikel'
    });
  }
};
