/* =================================
   SAFE SPACE KAMPUS
   JAVASCRIPT + FIREBASE
================================= */

// 1. KONFIGURASI FIREBASE

const firebaseConfig = {
    apiKey: "AIzaSyAVlKDgb526aRENCEDMI3ZHTw4E2S9vBsY",
    authDomain: "safe-space-kampus-7a226.firebaseapp.com",
    projectId: "safe-space-kampus-7a226",
    appId: "1:202957187576:web:f1eec54e81bb023e8cce0d"
};

let db = null;
let firebaseReady = false;

let allPosts = [];
let currentFilter = "all";


// 2. HUBUNGKAN FIREBASE

async function connectFirebase() {

    try {

        if (
            firebaseConfig.apiKey === "GANTI_API_KEY" ||
            firebaseConfig.projectId === "GANTI_PROJECT_ID"
        ) {
            console.warn("Firebase belum dikonfigurasi.");
            return;
        }

        const [
            appModule,
            firestoreModule,
            authModule
        ] = await Promise.all([

            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),

            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),

            import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js")

        ]);

        const app = appModule.initializeApp(firebaseConfig);

        db = firestoreModule.getFirestore(app);

        const auth = authModule.getAuth(app);

        await authModule.signInAnonymously(auth);

        window.firestore = firestoreModule;

        firebaseReady = true;

        console.log("Firebase berhasil terhubung!");

        listenPosts();

    } catch (error) {

        console.error("Firebase error:", error);

        alert("Firebase belum dapat dihubungkan. Periksa konfigurasi.");

    }

}


// 3. NAVIGASI HALAMAN

function showPage(pageId) {

    document.querySelectorAll(".page").forEach(page => {

        page.classList.remove("active");

    });

    document.getElementById(pageId).classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// 4. MEMBUKA FORMULIR

function openForm(formId) {

    document.querySelectorAll(".form-box").forEach(form => {

        form.classList.add("hidden");

    });

    document.getElementById(formId).classList.remove("hidden");

    document.getElementById(formId).scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// 5. FILTER POSTINGAN

function filterPosts(type) {

    currentFilter = type;

    renderPosts();

}


// 6. MENDENGARKAN POSTINGAN FIREBASE

function listenPosts() {

    const {
        collection,
        query,
        orderBy,
        onSnapshot
    } = window.firestore;

    const postQuery = query(
        collection(db, "publicPosts"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(postQuery, snapshot => {

        allPosts = snapshot.docs.map(doc => ({

            id: doc.id,
            ...doc.data()

        }));

        renderPosts();

    }, error => {

        console.error("Gagal mengambil postingan:", error);

    });

}


// 7. MENGAMANKAN TEKS HTML

function escapeHTML(text = "") {

    return String(text).replace(/[&<>"']/g, char => {

        const entities = {

            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"

        };

        return entities[char];

    });

}


// 8. MENAMPILKAN POSTINGAN

function renderPosts() {

    if (!firebaseReady) return;

    const container = document.getElementById("postsList");

    const filteredPosts = allPosts.filter(post => {

        return currentFilter === "all" ||
            post.kind === currentFilter;

    });

    if (filteredPosts.length === 0) {

        container.innerHTML = `
            <div class="post-card">
                Belum ada postingan.
                Jadilah yang pertama berbagi cerita ♡
            </div>
        `;

        return;

    }

    container.innerHTML = filteredPosts.map(post => {

        const replies = Array.isArray(post.replies)
            ? post.replies
            : [];

        return `

        <article class="post-card">

            <div class="post-header">

                <div class="avatar ${
                    post.kind === "motivation" ? "cream" : ""
                }">

                    ${escapeHTML((post.author || "?").charAt(0).toUpperCase())}

                </div>

                <div>

                    <b>${escapeHTML(post.author)}</b>

                    <small>
                        ${escapeHTML(post.faculty || "Mahasiswa")}
                        ·
                        ${post.kind === "story" ? "Keluh Kesah" : "Motivasi"}
                    </small>

                </div>

            </div>

            <p class="post-content">
                ${escapeHTML(post.content)}
            </p>

            <div class="post-footer">

                <span>♡ Saling menguatkan</span>

                <button type="button"
                    onclick="toggleReply('${escapeHTML(post.id)}')">

                    Balas (${replies.length})

                </button>

            </div>

            <div class="replies">

                ${replies.map(reply => `

                    <div class="reply-item">

                        <b>${escapeHTML(reply.author)}:</b>

                        ${escapeHTML(reply.content)}

                    </div>

                `).join("")}

            </div>

            <form class="reply-box"
                id="reply-${escapeHTML(post.id)}"
                onsubmit="sendReply(event, '${escapeHTML(post.id)}')"
                style="display:none; margin-top:15px;">

                <input name="reply"
                    maxlength="500"
                    required
                    placeholder="Tulis balasan yang baik...">

                <button type="submit">Kirim</button>

            </form>

        </article>

        `;

    }).join("");

}


// 9. MEMBUKA FORM BALASAN

function toggleReply(postId) {

    const form = document.getElementById("reply-" + postId);

    if (form) {

        form.style.display =
            form.style.display === "none" ? "flex" : "none";

    }

}


// 10. MENGIRIM BALASAN

async function sendReply(event, postId) {

    event.preventDefault();

    if (!firebaseReady) {

        alert("Firebase belum terhubung.");

        return;

    }

    const form = event.target;

    const content = new FormData(form).get("reply").trim();

    if (!content) return;

    try {

        const {
            doc,
            updateDoc,
            arrayUnion
        } = window.firestore;

        await updateDoc(
            doc(db, "publicPosts", postId),
            {
                replies: arrayUnion({

                    author: "Mahasiswa",
                    content: content,
                    createdAt: new Date().toISOString()

                })
            }
        );

        form.reset();

    } catch (error) {

        console.error(error);

        alert("Balasan gagal dikirim.");

    }

}


// 11. MEMBUAT POSTINGAN

async function publishPost(kind, form, statusId) {

    const status = document.getElementById(statusId);

    if (!firebaseReady) {

        status.textContent =
            "Firebase belum terhubung. Postingan belum dikirim.";

        return;

    }

    const data = new FormData(form);

    const post = {

        kind: kind,

        author: data.get("author").trim(),

        faculty: data.get("faculty").trim(),

        content: data.get("content").trim(),

        replies: [],

        createdAt: window.firestore.serverTimestamp()

    };

    if (!post.author || !post.content) {

        status.textContent = "Lengkapi formulir terlebih dahulu.";

        return;

    }

    try {

        const {
            collection,
            addDoc
        } = window.firestore;

        await addDoc(
            collection(db, "publicPosts"),
            post
        );

        form.reset();

        status.textContent = "";

        showPage("feed");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (error) {

        console.error(error);

        status.textContent =
            "Postingan gagal dikirim. Periksa koneksi dan aturan Firebase.";

    }

}


// 12. FORM KELUH KESAH

document.getElementById("publicStory")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        publishPost(
            "story",
            this,
            "storyStatus"
        );

    });


// 13. FORM MOTIVASI

document.getElementById("publicMotivation")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        publishPost(
            "motivation",
            this,
            "motivationStatus"
        );

    });


// 14. FORM PENGADUAN PRIVAT

document.getElementById("privateReport")
    .addEventListener("submit", async function(event) {

        event.preventDefault();

        const status = document.getElementById("privateStatus");

        if (!firebaseReady) {

            status.textContent =
                "Firebase belum terhubung. Laporan belum dikirim.";

            return;

        }

        const data = new FormData(this);

        const report = {

            name: data.get("name").trim() || "Tidak disebutkan",

            study: data.get("study").trim(),

            year: data.get("year").trim(),

            phone: data.get("phone").trim(),

            issue: data.get("issue"),

            details: data.get("details").trim(),

            help: data.get("help").trim(),

            status: "baru",

            createdAt: window.firestore.serverTimestamp()

        };

        try {

            const {
                collection,
                addDoc
            } = window.firestore;

            await addDoc(
                collection(db, "privateReports"),
                report
            );

            this.reset();

            status.textContent =
                "Pengaduan berhasil dikirim secara privat kepada admin kampus.";

        } catch (error) {

            console.error(error);

            status.textContent =
                "Pengaduan gagal dikirim. Silakan coba kembali.";

        }

    });


// 15. JALANKAN APLIKASI

connectFirebase();

window.showPage = showPage;
window.openForm = openForm;
window.filterPosts = filterPosts;
window.toggleReply = toggleReply;
window.sendReply = sendReply;