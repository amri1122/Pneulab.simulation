// ============================================================
// Pneulab - Media Simulasi Sistem Kendali Elektropneumatik
// SMK Negeri 1 Padang - Kelas XI Teknik Instalasi Tenaga Listrik (TITL)
// Standar Simbol: ISO 1219-1 (Pneumatik) & IEC 60617 (Elektrikal)
// ============================================================

(function() {
  'use strict';

  // ============================================================
  // 1. DATA & CONSTANTS
  // ============================================================

  // 1.1 Application State
  const AppState = {
    mode: 'edit', // 'edit' atau 'simulate'
    activeMaterial: null,
    activeTab: 'theory', // 'theory', 'steps', 'quiz', 'analysis'
    selectedComponentId: null,
    selectedConnectionId: null,
    selectedJunctionId: null,
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    isDragging: false,
    draggedComponentId: null,
    dragStartX: 0,
    dragStartY: 0,
    dragOffsetX: 0,
    dragOffsetY: 0,
    panStartX: 0,
    panStartY: 0,
    componentCounter: 0,
    connectionCounter: 0,
    junctionCounter: 0,
    sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
    libraryOpen: false,
    propertyOpen: false,
    activeView: 'workspace', // 'workspace' atau 'material'
    activeCategory: 'all',
    searchQuery: '',
    // Connection Drawing State
    connectionDrawing: {
      active: false,
      sourceType: 'port', // 'port' atau 'junction'
      sourceCompId: null,
      sourcePortNum: null,
      sourcePortId: null,
      sourceJunctionId: null,
      sourcePortType: null, // 'pneumatic' atau 'electrical'
      startPoint: null, // { x, y, side }
      currentSVGPoint: { x: 0, y: 0 }
    }
  };

  // 1.2 Components Data (placed on workspace)
  const workspaceComponents = [];

  // 1.3 Connections & Junctions Data
  const connections = [];
  const junctions = [];

  // 1.4 Materials Data (Lengkap dengan Teori, Langkah, Kuis TITL, & Rangkaian Contoh)
  const materials = {
    direct: {
      id: 'direct',
      number: '1',
      title: 'Rangkaian Pneumatik Langsung',
      subtitle: 'Direct Pneumatic Control',
      badge: 'Materi 1',
      description: 'Pada rangkaian pneumatik langsung, aktuator (silinder) dikontrol secara langsung oleh katup pengarah tanpa menggunakan katup perantara. Sinyal kontrol dari tombol tekan mekanik langsung menggeser spool katup utama yang mengalirkan udara bertekanan kerja menuju silinder kerja tunggal.',
      objectives: [
        'Memahami prinsip kerja sistem kendali pneumatik langsung sesuai standar ISO 1219-1.',
        'Mengidentifikasi simbol, fungsi port (1, 2, 3), dan cara kerja katup 3/2 normally closed (NC).',
        'Menjelaskan fungsi pegas pembalik (spring return) pada silinder kerja tunggal dan katup.',
        'Menyusun diagram rangkaian kendali pneumatik langsung secara mandiri dan benar.',
        'Menganalisis aliran udara bertekanan saat kondisi normal, tombol ditekan, dan tombol dilepas.'
      ],
      components: [
        'Kompresor (Sumber Pasokan Udara 6 bar)',
        'Unit Pengolah Udara FRL (Filter, Regulator, Lubricator)',
        'Katup Pengarah 3/2 Tombol Tekan & Pegas Balik (NC)',
        'Silinder Kerja Tunggal (Single-Acting Cylinder with Spring Return)',
        'Selang Udara Pneumatik Standar ISO'
      ],
      theoryText: `
        <div class="theory-card">
          <div class="theory-card-title">Prinsip Kerja Rangkaian Pneumatik Langsung:</div>
          <p>Sistem kendali langsung menggunakan katup 3/2 (3 port, 2 posisi) beraktuasi tombol tekan manual dan pegas pembalik. Katup ini memiliki 3 saluran utama:</p>
          <table class="theory-table">
            <tr><th>Nomor Port</th><th>Kode Huruf</th><th>Fungsi Standar ISO 1219</th></tr>
            <tr><td><strong>Port 1</strong></td><td>P (Pressure)</td><td>Saluran pasokan udara bertekanan dari kompresor/FRL</td></tr>
            <tr><td><strong>Port 2</strong></td><td>A (Working line)</td><td>Saluran keluaran kerja menuju silinder</td></tr>
            <tr><td><strong>Port 3</strong></td><td>R (Exhaust)</td><td>Saluran pembuangan udara ke atmosfer</td></tr>
          </table>
          <p style="margin-top:8px;"><strong>1. Kondisi Normal (Sebelum Tombol Ditekan):</strong> Spool katup berada pada posisi NC (Normally Closed) karena dorongan pegas. Port 1 tertutup, sedangkan Port 2 terhubung ke Port 3 (exhaust). Silinder dalam kondisi mundur (0%) karena dorongan pegas internal silinder.</p>
          <p><strong>2. Saat Tombol Ditekan:</strong> Gaya mekanik mengatasi gaya pegas, menggeser spool katup ke posisi aktif. Port 1 terhubung ke Port 2, Port 3 tertutup. Udara bertekanan 6 bar mengalir ke ruang silinder, mendorong piston maju (100%) melawan pegas silinder.</p>
          <p><strong>3. Saat Tombol Dilepas:</strong> Pegas katup mengembalikan spool ke posisi normal. Udara di dalam silinder terbuang melalui Port 3, dan pegas silinder menarik piston kembali mundur (0%).</p>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: 'Muat Rangkaian atau Siapkan Komponen',
          desc: 'Klik tombol "Muat Contoh Rangkaian" di atas untuk memuat rangkaian standar langsung ke area kerja, atau tarik komponen Kompresor, FRL, Katup 3/2, dan Silinder Kerja Tunggal dari library.'
        },
        {
          num: 2,
          title: 'Pemeriksaan Sambungan Jalur Udara',
          desc: 'Pastikan Port OUT Kompresor terhubung ke Port 1 FRL, Port 2 FRL terhubung ke Port 1(P) Katup 3/2, dan Port 2(A) Katup 3/2 terhubung ke Port IN Silinder Tunggal.'
        },
        {
          num: 3,
          title: 'Beralih ke Mode Simulasi',
          desc: 'Klik tombol "Mode Edit" di header kanan atas untuk beralih ke "Mode Simulasi". Semua posisi komponen terkunci dan area kontrol simulasi aktif.'
        },
        {
          num: 4,
          title: 'Pengoperasian Katup Tombol 3/2',
          desc: 'Arahkan kursor ke tombol V1 pada area kerja atau gunakan tombol "[Tekan]" pada bilah kontrol di bawah. Tekan dan tahan tombol untuk mengamati udara bertekanan mengalir (jalur berubah biru tua) dan piston silinder bergerak maju.'
        },
        {
          num: 5,
          title: 'Pelepasan Tombol & Analisis Pembuangan',
          desc: 'Lepaskan tombol mouse. Amati pegas katup mengembalikan posisi katup, udara silinder keluar melalui lubang pembuangan 3(R), dan piston ditarik kembali oleh pegas silinder.'
        }
      ],
      quiz: [
        {
          id: 'q1_1',
          question: 'Pada katup pengarah 3/2, nomor port 1, 2, dan 3 secara berurutan berfungsi sebagai...',
          options: [
            'Port Pasokan Tekanan (P), Port Kerja (A), Port Pembuangan (R)',
            'Port Pembuangan (R), Port Pasokan Tekanan (P), Port Kerja (A)',
            'Port Kerja (A), Port Pembuangan (R), Port Pilot (Z)',
            'Port Pilot (Z), Port Pasokan Tekanan (P), Port Kerja (A)'
          ],
          correct: 0,
          explanation: 'Berdasarkan standar ISO 1219, angka ganjil 1 adalah pasokan udara (Pressure), angka genap 2 adalah saluran kerja ke aktuator (Working line), dan angka ganjil 3 adalah pembuangan udara ke atmosfer (Exhaust).'
        },
        {
          id: 'q1_2',
          question: 'Apa komponen yang mengembalikan piston silinder kerja tunggal saat pasokan udara terputus?',
          options: [
            'Tekanan udara kompresor dari port pembuangan',
            'Pegas pembalik mekanik di dalam silinder (internal return spring)',
            'Katup satu arah (check valve)',
            'Sensor mekanik limit switch'
          ],
          correct: 1,
          explanation: 'Silinder kerja tunggal (Single-Acting Cylinder) hanya memiliki satu port udara. Gerakan maju digerakkan oleh udara bertekanan, sedangkan gerakan mundur sepenuhnya mengandalkan pegas pembalik internal saat udara di ruang silinder dibuang.'
        },
        {
          id: 'q1_3',
          question: 'Mengapa rangkaian kendali pneumatik langsung TIDAK direkomendasikan untuk silinder berdiameter besar?',
          options: [
            'Karena memerlukan tombol manual berukuran besar dengan gaya tekan manusia yang sangat berat dan debit aliran udara terbatas',
            'Karena silinder besar hanya dapat digerakkan oleh motor listrik',
            'Karena kompresor tidak dapat menghasilkan tekanan di atas 1 bar',
            'Karena katup langsung tidak memiliki saluran pembuangan'
          ],
          correct: 0,
          explanation: 'Pada silinder besar, laju aliran udara (debit Q) yang dibutuhkan sangat tinggi. Menggunakan katup tombol manual langsung membutuhkan ukuran katup yang sangat besar dan gaya fisik operator yang berat. Oleh karena itu, industri menggunakan kendali tak langsung (katup pilot).'
        },
        {
          id: 'q1_4',
          question: 'Kondisi katup 3/2 yang pada saat belum diaktifkan menutup aliran dari port 1 ke port 2 disebut...',
          options: [
            'Normally Closed (NC)',
            'Normally Open (NO)',
            'Bistable Memory',
            'Closed Center'
          ],
          correct: 0,
          explanation: 'Normally Closed (NC) berarti dalam kondisi normal (belum ditekan/istirahat), saluran pasokan udara utama tertutup, dan saluran kerja terhubung ke pembuangan.'
        },
        {
          id: 'q1_5',
          question: 'Jika tombol katup 3/2 sudah ditekan namun piston silinder tidak bergerak maju sama sekali, langkah diagnostik awal yang paling tepat adalah...',
          options: [
            'Memeriksa apakah Port 1 katup telah terhubung ke sumber tekanan kompresor/FRL',
            'Mengganti jenis silinder menjadi silinder ganda',
            'Memutus sambungan kabel listrik 24V',
            'Menutup lubang pembuangan port 3 dengan sumbat permanen'
          ],
          correct: 0,
          explanation: 'Pemeriksaan pertama pada sistem pneumatik adalah memverifikasi ketersediaan tekanan pada Port 1 (P). Tanpa pasokan tekanan udara masuk ke katup, penekanan tombol tidak akan menyalurkan energi kerja ke silinder.'
        }
      ]
    },

    indirect: {
      id: 'indirect',
      number: '2',
      title: 'Rangkaian Pneumatik Tak Langsung',
      subtitle: 'Indirect Pneumatic Control',
      badge: 'Materi 2',
      description: 'Pada rangkaian pneumatik tak langsung, aktuator (silinder kerja ganda) dikontrol melalui katup perantara (pilot valve). Operator cukup menekan tombol kecil pada katup kendali 3/2 untuk menghasilkan sinyal pneumatik yang menggeser katup utama 5/2. Rangkaian ini memisahkan sirkuit sinyal kontrol dari sirkuit daya udara bertekanan tinggi.',
      objectives: [
        'Memahami konsep pemisahan sirkuit sinyal (control signal) dan sirkuit daya (power circuit).',
        'Mengidentifikasi simbol dan fungsi port katup 5/2 (Port 1, 2, 4, 3, 5, dan Port Pilot 14/12).',
        'Menganalisis prinsip kerja silinder kerja ganda (Double-Acting Cylinder).',
        'Menyusun rangkaian kendali tak langsung menggunakan katup kendali 3/2 dan katup utama 5/2 pilot.',
        'Mengevaluasi keunggulan kendali tak langsung untuk aktuator industri berdaya besar dan kendali jarak jauh.'
      ],
      components: [
        'Kompresor (Sumber Daya Udara Utama)',
        'Unit FRL (Filter, Regulator, Lubricator)',
        'Katup Kendali 3/2 Tombol Tekan (Pilot Valve Sinyal Maju)',
        'Katup Utama 5/2 Aktuasi Pilot Pneumatik & Pegas Balik (Power Valve)',
        'Silinder Kerja Ganda (Double-Acting Cylinder)',
        'Konektor T-Junction (Percabangan Pasokan Udara)'
      ],
      theoryText: `
        <div class="theory-card">
          <div class="theory-card-title">Mengapa Menggunakan Sistem Kendali Tak Langsung?</div>
          <p>Dalam industri otomasi, silinder kerja ganda berukuran besar membutuhkan volume udara yang masif. Mengalirkan volume besar langsung melalui tombol operator sangat tidak ergonomis, berbahaya, dan memicu rugi tekanan (pressure drop). Sistem tak langsung membagi sistem menjadi:</p>
          <ul style="margin-left: 20px; font-size: 12.5px; color: #334155; line-height: 1.6;">
            <li><strong>Sirkuit Sinyal (Control Circuit):</strong> Menggunakan selang kecil dan katup 3/2 kecil yang ringan ditekan operator untuk mengirim pulsa udara pilot.</li>
            <li><strong>Sirkuit Daya (Power Circuit):</strong> Menggunakan katup utama 5/2 dengan kapasitas aliran besar yang terpasang dekat dengan silinder kerja ganda.</li>
          </ul>
          <div class="theory-card-title" style="margin-top: 10px;">Penomoran Standar Port Katup 5/2 (ISO 1219):</div>
          <table class="theory-table">
            <tr><th>Port</th><th>Fungsi</th><th>Port</th><th>Fungsi</th></tr>
            <tr><td><strong>1 (P)</strong></td><td>Pasokan Tekanan Utama</td><td><strong>14 (Z)</strong></td><td>Sinyal Pilot (Mengarahkan 1 ke 4)</td></tr>
            <tr><td><strong>2 (A)</strong></td><td>Saluran Kerja Mundur (Silinder B)</td><td><strong>12 (Y)</strong></td><td>Sinyal Pilot (Mengarahkan 1 ke 2)</td></tr>
            <tr><td><strong>4 (B)</strong></td><td>Saluran Kerja Maju (Silinder A)</td><td><strong>3 (R), 5 (S)</strong></td><td>Saluran Pembuangan Udara</td></tr>
          </table>
          <p style="margin-top: 8px;"><strong>Prinsip Kerja Silinder Kerja Ganda:</strong> Silinder kerja ganda tidak memiliki pegas balik. Gerakan maju terjadi saat Port A diisi udara bertekanan dan Port B dibuang. Gerakan mundur terjadi saat Port B diisi udara dan Port A dibuang.</p>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: 'Muat Rangkaian Contoh Materi 2',
          desc: 'Klik tombol "Muat Contoh Rangkaian" untuk menyusun katup kendali 3/2 PB1, katup utama 5/2 pilot, dan silinder kerja ganda secara otomatis.'
        },
        {
          num: 2,
          title: 'Periksa Jalur Percabangan Pasokan Udara',
          desc: 'Perhatikan bahwa pasokan udara dari FRL dicabangkan menggunakan junction: satu cabang memberi pasokan ke Port 1 Katup Kendali 3/2, dan cabang lain memberi pasokan ke Port 1 Katup Utama 5/2.'
        },
        {
          num: 3,
          title: 'Periksa Saluran Pilot Pneumatik',
          desc: 'Port 2(A) Katup Kendali 3/2 terhubung ke Port 14 (sisi kiri pilot) Katup Utama 5/2. Saluran kerja 4(B) katup 5/2 terhubung ke port silinder A (maju), dan saluran 2(A) ke port silinder B (mundur).'
        },
        {
          num: 4,
          title: 'Uji Coba Pengoperasian di Mode Simulasi',
          desc: 'Beralih ke Mode Simulasi. Pada kondisi awal, katup 5/2 normal menyalurkan udara ke port B silinder (posisi mundur). Tekan dan tahan tombol PB1.'
        },
        {
          num: 5,
          title: 'Amati Pergeseran Spool Pilot dan Gerakan Maju',
          desc: 'Perhatikan: udara pilot mengalir ke port 14 katup 5/2, spool katup 5/2 bergeser aktif, udara bertekanan utama masuk ke port A silinder, dan piston bergerak maju mulus hingga 100%.'
        }
      ],
      quiz: [
        {
          id: 'q2_1',
          question: 'Port pilot nomor 14 pada katup pengarah 5/2 memiliki fungsi untuk...',
          options: [
            'Menggeser spool katup sehingga udara pasokan Port 1 dialirkan menuju Port 4',
            'Menggeser spool katup sehingga udara pasokan Port 1 dialirkan menuju Port 2',
            'Membuang udara berlebih ke atmosfer',
            'Menerima pasokan listrik DC 24V dari transformator'
          ],
          correct: 0,
          explanation: 'Penomoran pilot port 14 berarti: ketika sinyal tekanan diterima pada port ini, saluran pasokan nomor 1 akan dihubungkan ke saluran kerja nomor 4 (1 to 4 -> 14).'
        },
        {
          id: 'q2_2',
          question: 'Perbedaan mendasar silinder kerja ganda dibandingkan silinder kerja tunggal adalah...',
          options: [
            'Silinder kerja ganda memiliki dua port masukan dan dapat menghasilkan gaya dorong pada langkah maju maupun mundur',
            'Silinder kerja ganda tidak membutuhkan pelumasan udara FRL',
            'Silinder kerja ganda memiliki pegas di kedua sisi piston',
            'Silinder kerja ganda hanya dapat dikontrol menggunakan listrik AC'
          ],
          correct: 0,
          explanation: 'Silinder kerja ganda (Double-Acting Cylinder) memiliki dua port (A dan B) untuk menyalurkan udara secara bergantian di depan dan belakang piston, sehingga menghasilkan tenaga kerja pada langkah maju (extend) maupun mundur (retract).'
        },
        {
          id: 'q2_3',
          question: 'Katup 5/2 yang mempertahankan posisinya meskipun sinyal pilot pada port 14 telah dilepas disebut katup...',
          options: [
            'Bistable (Memori / Double Pilot)',
            'Monostable (Spring Return)',
            'Normally Closed (NC)',
            'Quick Exhaust Valve'
          ],
          correct: 0,
          explanation: 'Katup bistable (memiliki memori) dikendalikan oleh dua pilot (14 dan 12) tanpa pegas pembalik. Sekali diberi sinyal, katup akan mengunci posisinya hingga sinyal berlawanan diberikan.'
        },
        {
          id: 'q2_4',
          question: 'Pada katup 5/2, dua port pembuangan diberi nomor standar ISO...',
          options: [
            'Port 3 dan Port 5',
            'Port 2 dan Port 4',
            'Port 12 dan Port 14',
            'Port 1 dan Port 3'
          ],
          correct: 0,
          explanation: 'Angka 3 dan 5 adalah nomor standar internasional (ISO 1219) untuk saluran pembuangan (Exhaust ports R dan S) pada katup 5 port.'
        },
        {
          id: 'q2_5',
          question: 'Dalam rangkaian kendali tak langsung, peran katup 3/2 tombol tekan adalah sebagai...',
          options: [
            'Katup pemberi sinyal kontrol (pilot signal valve)',
            'Aktuator penggerak beban mekanik',
            'Komponen pengering udara kompresor',
            'Regulator tekanan utama'
          ],
          correct: 0,
          explanation: 'Katup 3/2 berperan sebagai katup pembuat sinyal (signal generator/pilot valve) yang memberikan komando tekanan kepada katup daya utama 5/2.'
        }
      ]
    },

    electropneumatic: {
      id: 'electropneumatic',
      number: '3',
      title: 'Rangkaian Elektropneumatik',
      subtitle: 'Electropneumatic Control',
      badge: 'Materi 3',
      description: 'Rangkaian elektropneumatik menggabungkan teknologi kelistrikan kontrol arus searah (DC 24V) dengan pneumatik daya. Sinyal perintah dikendalikan melalui tombol listrik, kontak relai, atau sensor limit switch yang memberi energi pada kumparan solenoid (solenoid valve) untuk menggerakkan katup pengarah pneumatik.',
      objectives: [
        'Memahami integrasi antara diagram kelistrikan (ladder diagram) dan diagram pneumatik daya.',
        'Mengidentifikasi simbol dan prinsip kerja katup solenoid 5/2 (solenoid valve).',
        'Menganalisis konversi energi elektromagnetik pada kumparan solenoid (Y1) menjadi aksi mekanis katup.',
        'Menguasai penggunaan tombol NO/NC, relai kontrol (K1), dan saklar batas (Limit Switch 1S1/1S2).',
        'Melakukan penelusuran gangguan kontinuitas listrik dan ketersediaan tekanan secara terpadu.'
      ],
      components: [
        'Catu Daya DC 24V (Terminal +24V dan 0V Ground)',
        'Tombol Tekan Listrik NO S1 (Normally Open: Terminal 13-14)',
        'Relai Kontrol Elektromagnetik K1 (Terminal A1-A2)',
        'Kontak Bantu Relai NO K1-1 (Rangkaian Pengunci Self-Holding)',
        'Kumparan Solenoid Y1 (Terminal A1-A2)',
        'Katup Solenoid 5/2 Solenoid-Spring (Solenoid Valve)',
        'Silinder Kerja Ganda (Double-Acting Cylinder A1)',
        'Lampu Indikator Panel H1 (Status Aktif)',
        'Limit Switch 1S1/1S2 (Saklar Batas Mekanis Otomatis)'
      ],
      theoryText: `
        <div class="theory-card">
          <div class="theory-card-title">Arsitektur Sistem Elektropneumatik:</div>
          <p>Sistem kendali elektropneumatik terdiri atas dua bagian yang terisolasi secara fisik namun terhubung secara fungsional melalui katup solenoid:</p>
          <ul style="margin-left: 20px; font-size: 12.5px; color: #334155; line-height: 1.6;">
            <li><strong>1. Diagram Kelistrikan (Control Circuit):</strong> Menggunakan tegangan aman DC 24V standar industri TITL. Terdiri atas tombol tekan, relai, limit switch, dan kumparan solenoid (Y1).</li>
            <li><strong>2. Diagram Pneumatik (Power Circuit):</strong> Menggunakan udara bertekanan 6 bar. Terdiri atas kompresor, FRL, katup solenoid 5/2, dan silinder kerja ganda.</li>
          </ul>
          <div class="theory-card-title" style="margin-top: 10px;">Kopling Solenoid (Tag Linkage):</div>
          <p>Pada media simulasi ini, kumparan solenoid listrik dan katup pneumatik dikaitkan menggunakan tag label yang sama (contoh: <strong>Y1</strong>). Ketika arus listrik 24V mengalir melintasi kumparan Y1, timbul medan elektromagnetik yang menarik plunyer inti besi. Plunyer ini membuka saluran pilot internal yang menggeser spool katup 5/2.</p>
          <div class="theory-card-title" style="margin-top: 8px;">Sensor Posisi Limit Switch (1S1 dan 1S2):</div>
          <p>Untuk kendali otomatis atau semi-otomatis, sensor limit switch dipasang pada posisi ujung silinder:</p>
          <ul style="margin-left: 20px; font-size: 12px; color: #334155;">
            <li><strong>1S1:</strong> Terletak pada posisi awal (0% / silinder retracted). Aktif saat silinder mundur penuh.</li>
            <li><strong>1S2:</strong> Terletak pada posisi ujung (100% / silinder extended). Aktif saat silinder maju penuh.</li>
          </ul>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: 'Muat Rangkaian Elektropneumatik',
          desc: 'Klik tombol "Muat Contoh Rangkaian" untuk memuat rangkaian pneumatik di bagian atas dan rangkaian kelistrikan ladder di bagian bawah secara teratur.'
        },
        {
          num: 2,
          title: 'Identifikasi Dua Diagram Terpisah',
          desc: 'Perhatikan pemisahan diagram: Diagram Pneumatik (biru) di bagian atas dan Diagram Listrik 24V (merah/kuning) di bagian bawah. Keduanya ditautkan oleh kumparan Solenoid Y1.'
        },
        {
          num: 3,
          title: 'Pemeriksaan Rangkaian Kelistrikan',
          desc: 'Pastikan jalur listrik +24V DC terhubung ke tombol NO S1 dan kontak pengunci NO K1-1 (paralel), kemudian menuju kumparan Relai K1 (A1), kumparan Solenoid Y1 (A1), dan Lampu H1 (X1). Terminal A2 dan X2 terhubung ke rel 0V DC (GND).'
        },
        {
          num: 4,
          title: 'Jalankan Mode Simulasi & Tekan Tombol S1',
          desc: 'Aktifkan Mode Simulasi. Klik tombol S1 pada bilah kontrol simulasi di bawah. Amati kumparan Relai K1 teraliri arus, kontak NO K1-1 menutup mengunci aliran listrik (+24V), dan lampu H1 menyala.'
        },
        {
          num: 5,
          title: 'Amati Penguncian (Self-Holding) & Gerakan Silinder',
          desc: 'Kumparan Y1 mendapat daya -> katup solenoid 5/2 bergeser aktif -> udara mengalir ke silinder port A -> piston silinder bergerak maju hingga 100%. Saat S1 dilepas, kontak K1-1 mempertahankan arus sehingga silinder tetap maju dan lampu H1 tetap menyala.'
        }
      ],
      quiz: [
        {
          id: 'q3_1',
          question: 'Komponen yang berfungsi sebagai pengubah energi listrik menjadi aksi mekanis pneumatik adalah...',
          options: [
            'Katup Solenoid (Solenoid Valve)',
            'Saklar Batas (Limit Switch)',
            'Unit Pengolah Udara (FRL)',
            'Relai Termal Beban Lebih'
          ],
          correct: 0,
          explanation: 'Katup solenoid (Solenoid Valve) adalah elemen transduser elektromekanis yang mengubah energi listrik pada kumparan koil menjadi medan magnet yang menggeser spool katup pneumatik.'
        },
        {
          id: 'q3_2',
          question: 'Berapakah standar tegangan kendali arus searah yang paling umum dan aman digunakan pada elektropneumatik industri?',
          options: [
            '24V DC',
            '220V AC',
            '380V 3 Fasa',
            '5V TTL'
          ],
          correct: 0,
          explanation: 'Tegangan DC 24V merupakan standar industri otomasi internasional (IEC 61131) karena aman terhadap sengatan listrik operator (Extra Low Voltage), tahan terhadap noise frekuensi, dan stabil untuk switching induktif.'
        },
        {
          id: 'q3_3',
          question: 'Terminal A1 dan A2 pada komponen relai atau solenoid standar IEC berfungsi sebagai...',
          options: [
            'Terminal sambungan kumparan / koil elektromagnetik',
            'Kontak daya utama normally open',
            'Kontak bantu normally closed',
            'Terminal grounding sistem pentanahan'
          ],
          correct: 0,
          explanation: 'Menurut standar penomoran IEC, terminal A1 (kutub positif/fasa) dan A2 (kutub netral/0V) selalu menandakan terminal masukan kumparan elektromagnetik (koil).'
        },
        {
          id: 'q3_4',
          question: 'Pada rangkaian pengunci (self-holding / latching circuit), kontak NO relai K1 dipasang secara...',
          options: [
            'Paralel dengan tombol Start (Push Button NO)',
            'Seri dengan tombol Start',
            'Seri dengan sumber tegangan 0V',
            'Paralel dengan beban kumparan solenoid'
          ],
          correct: 0,
          explanation: 'Kontak NO relai K1 dipasang paralel dengan tombol Start NO agar ketika tombol Start dilepas, arus listrik tetap mengalir melalui kontak K1 yang telah menutup (mengunci).'
        },
        {
          id: 'q3_5',
          question: 'Jika tombol NO S1 ditekan dan lampu H1 menyala, namun silinder A1 tidak bergerak sama sekali, kemungkinan penyebab teknisnya adalah...',
          options: [
            'Nama tag solenoid pada katup (misal Y1) tidak cocok dengan label kumparan elektrik, atau pasokan udara FRL belum tersambung',
            'Tegangan catu daya 24V terlalu bersih',
            'Warna lampu indikator tidak sesuai standar',
            'Silinder dipasang terbalik'
          ],
          correct: 0,
          explanation: 'Menyala lampu membuktikan rangkaian listrik berfungsi. Jika silinder tetap diam, kemungkinan penyebabnya adalah solenoid katup belum terhubung secara logis (tag label beda) atau pasokan udara pneumatik belum tersedia pada port 1 katup.'
        }
      ]
    }
  };

  // 1.5 Component Library Definition (25 komponen teknik standar ISO 1219 & IEC 60617)
  const componentLibrary = [
    // Group 1: Sumber Pasokan (air-source)
    {
      id: 'compressor',
      name: 'Kompresor',
      description: 'Sumber pasokan udara bertekanan utama (P = 6.0 bar)',
      category: 'air-source',
      categoryName: 'Sumber Udara',
      type: 'pneumatic',
      defaultLabel: 'Kompresor',
      width: 60,
      height: 60,
      ports: [
        { name: 'OUT', portNumber: 1, type: 'pneumatic', side: 'top', offset: 0.5 }
      ],
      defaultProperties: {
        pressure: 6.0,
        flowRate: 100
      }
    },
    {
      id: 'frl-unit',
      name: 'Unit FRL',
      description: 'Filter, Regulator Tekanan, dan Lubricator',
      category: 'air-source',
      categoryName: 'Sumber Udara',
      type: 'pneumatic',
      defaultLabel: 'FRL',
      width: 80,
      height: 50,
      ports: [
        { name: '1(IN)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.3 },
        { name: '2(OUT)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.7 }
      ],
      defaultProperties: {
        setPressure: 6.0,
        filterRating: '5μm'
      }
    },

    // Group 2: Katup Pengarah Pneumatik (valve)
    {
      id: 'valve-3-2',
      name: 'Katup 3/2 Tombol',
      description: 'Katup pengarah 3/2 tombol tekan & pegas balik (NC)',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'V1',
      width: 100,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.62 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.62 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.87 }
      ],
      defaultProperties: {
        valveType: '3/2',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'closed',
        returnType: 'spring'
      }
    },
    {
      id: 'valve-5-2',
      name: 'Katup 5/2',
      description: 'Katup pengarah 5 port, 2 posisi (Konfigurasi Fleksibel)',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'V1',
      width: 120,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.75 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.92 },
        { name: '4(B)', portNumber: 4, type: 'pneumatic', side: 'top', offset: 0.58 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.92 },
        { name: '5(S)', portNumber: 5, type: 'pneumatic', side: 'bottom', offset: 0.58 }
      ],
      defaultProperties: {
        valveType: '5/2',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'position-a',
        returnType: 'spring'
      }
    },
    {
      id: 'valve-5-2-pilot',
      name: 'Katup 5/2 Pilot',
      description: 'Katup 5/2 aktuasi pilot pneumatik Port 14 & pegas balik',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'V1',
      width: 120,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.75 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.92 },
        { name: '4(B)', portNumber: 4, type: 'pneumatic', side: 'top', offset: 0.58 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.92 },
        { name: '5(S)', portNumber: 5, type: 'pneumatic', side: 'bottom', offset: 0.58 },
        { name: '14(Z)', portNumber: 6, type: 'pneumatic', side: 'left', offset: 0.5 }
      ],
      defaultProperties: {
        valveType: '5/2',
        actuationLeft: 'pilot',
        actuationRight: 'spring',
        normalPosition: 'position-a',
        returnType: 'spring'
      }
    },
    {
      id: 'valve-5-2-solenoid',
      name: 'Katup 5/2 Solenoid',
      description: 'Katup 5/2 aktuasi elektrik solenoid Y1 & pegas balik',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'V1',
      width: 120,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.75 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.92 },
        { name: '4(B)', portNumber: 4, type: 'pneumatic', side: 'top', offset: 0.58 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.92 },
        { name: '5(S)', portNumber: 5, type: 'pneumatic', side: 'bottom', offset: 0.58 }
      ],
      defaultProperties: {
        valveType: '5/2',
        actuationLeft: 'solenoid',
        actuationRight: 'spring',
        solenoidRef: 'Y1',
        normalPosition: 'position-a',
        returnType: 'spring'
      }
    },
    {
      id: 'valve-3-2-roller',
      name: 'Katup 3/2 Roller',
      description: 'Katup 3/2 mekanis tuas roller (sensor posisi pneumatik)',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'S1',
      width: 100,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.62 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.62 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.87 }
      ],
      defaultProperties: {
        valveType: '3/2',
        actuationLeft: 'roller',
        actuationRight: 'spring',
        normalPosition: 'closed',
        returnType: 'spring'
      }
    },
    {
      id: 'valve-5-3',
      name: 'Katup 5/3 Closed Center',
      description: 'Katup pengarah 5 port, 3 posisi posisi tengah tertutup',
      category: 'valve',
      categoryName: 'Katup Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'V1',
      width: 150,
      height: 60,
      ports: [
        { name: '1(P)', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.5 },
        { name: '2(A)', portNumber: 2, type: 'pneumatic', side: 'top', offset: 0.7 },
        { name: '4(B)', portNumber: 4, type: 'pneumatic', side: 'top', offset: 0.3 },
        { name: '3(R)', portNumber: 3, type: 'pneumatic', side: 'bottom', offset: 0.8 },
        { name: '5(S)', portNumber: 5, type: 'pneumatic', side: 'bottom', offset: 0.2 }
      ],
      defaultProperties: {
        valveType: '5/3',
        actuationLeft: 'solenoid',
        actuationRight: 'solenoid',
        normalPosition: 'center-closed',
        returnType: 'spring-centered'
      }
    },

    // Group 3: Aktuator Silinder (actuator)
    {
      id: 'cylinder-single',
      name: 'Silinder Kerja Tunggal',
      description: 'Silinder pegas pembalik (Single-acting cylinder)',
      category: 'actuator',
      categoryName: 'Aktuator',
      type: 'pneumatic',
      defaultLabel: 'A1',
      width: 130,
      height: 55,
      ports: [
        { name: 'IN', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.25 }
      ],
      defaultProperties: {
        cylinderType: 'single-acting',
        strokeLength: 100,
        position: 0.0
      }
    },
    {
      id: 'cylinder-double',
      name: 'Silinder Kerja Ganda',
      description: 'Silinder maju & mundur (Double-acting cylinder)',
      category: 'actuator',
      categoryName: 'Aktuator',
      type: 'pneumatic',
      defaultLabel: 'A1',
      width: 130,
      height: 55,
      ports: [
        { name: 'A', portNumber: 1, type: 'pneumatic', side: 'bottom', offset: 0.25 },
        { name: 'B', portNumber: 2, type: 'pneumatic', side: 'bottom', offset: 0.75 }
      ],
      defaultProperties: {
        cylinderType: 'double-acting',
        strokeLength: 100,
        position: 0.0
      }
    },

    // Group 4: Kendali & Logika Pneumatik (pneumatic-control)
    {
      id: 'valve-and',
      name: 'Katup AND (Dua Tekanan)',
      description: 'Elemen logika AND (Dual Pressure Valve)',
      category: 'pneumatic-control',
      categoryName: 'Kendali Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'AND1',
      width: 60,
      height: 60,
      ports: [
        { name: 'X', portNumber: 1, type: 'pneumatic', side: 'left', offset: 0.3 },
        { name: 'Y', portNumber: 2, type: 'pneumatic', side: 'left', offset: 0.7 },
        { name: 'A', portNumber: 3, type: 'pneumatic', side: 'right', offset: 0.5 }
      ],
      defaultProperties: {}
    },
    {
      id: 'valve-or',
      name: 'Katup OR (Shuttle Valve)',
      description: 'Katup ganti logika OR (Shuttle Valve)',
      category: 'pneumatic-control',
      categoryName: 'Kendali Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'OR1',
      width: 60,
      height: 60,
      ports: [
        { name: 'X', portNumber: 1, type: 'pneumatic', side: 'left', offset: 0.3 },
        { name: 'Y', portNumber: 2, type: 'pneumatic', side: 'left', offset: 0.7 },
        { name: 'A', portNumber: 3, type: 'pneumatic', side: 'right', offset: 0.5 }
      ],
      defaultProperties: {}
    },
    {
      id: 'pilot-line',
      name: 'Saluran Pilot',
      description: 'Konektor sinyal kontrol pilot pneumatik',
      category: 'pneumatic-control',
      categoryName: 'Kendali Pneumatik',
      type: 'pneumatic',
      defaultLabel: 'PL1',
      width: 50,
      height: 50,
      ports: [
        { name: 'IN', portNumber: 1, type: 'pneumatic', side: 'left', offset: 0.5 },
        { name: 'OUT', portNumber: 2, type: 'pneumatic', side: 'right', offset: 0.5 }
      ],
      defaultProperties: {}
    },

    // Group 5: Komponen Elektrikal (electrical)
    {
      id: 'dc-source',
      name: 'Sumber Tegangan +24V',
      description: 'Terminal sumber tegangan +24V DC',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: '24V DC',
      width: 32,
      height: 24,
      ports: [
        { name: '+24V', portNumber: 1, type: 'electrical', side: 'right', offset: 0.5 },
        { name: '0V', portNumber: 2, type: 'electrical', side: 'left', offset: 0.5 }
      ],
      defaultProperties: { voltage: 24 }
    },
    {
      id: 'terminal-0v',
      name: 'Terminal 0V (Netral)',
      description: 'Titik netral / 0V (GND)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: '0V',
      width: 32,
      height: 24,
      ports: [
        { name: '0V', portNumber: 1, type: 'electrical', side: 'right', offset: 0.5 }
      ],
      defaultProperties: {}
    },
    {
      id: 'button-no',
      name: 'Tombol Tekan NO (Make)',
      description: 'Pushbutton Normally Open momentary (Pin 13-14)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S1',
      width: 50,
      height: 50,
      ports: [
        { name: '13', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: '14', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NO', isDetent: false, state: 'open' }
    },
    {
      id: 'button-no-detent',
      name: 'Tombol Detent NO (Make)',
      description: 'Detent switch Normally Open latching (Pin 13-14)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S2',
      width: 50,
      height: 50,
      ports: [
        { name: '13', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: '14', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NO', isDetent: true, state: 'open' }
    },
    {
      id: 'button-nc',
      name: 'Tombol Tekan NC (Break)',
      description: 'Pushbutton Normally Closed momentary (Pin 11-12)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S3',
      width: 50,
      height: 50,
      ports: [
        { name: '11', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: '12', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NC', isDetent: false, state: 'closed' }
    },
    {
      id: 'button-nc-detent',
      name: 'Tombol Detent NC (Break)',
      description: 'Detent switch Normally Closed latching (Pin 11-12)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S4',
      width: 50,
      height: 50,
      ports: [
        { name: '11', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: '12', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NC', isDetent: true, state: 'closed' }
    },
    {
      id: 'button-changeover',
      name: 'Tombol Changeover (Push)',
      description: 'Pushbutton changeover / SPDT momentary (Pin 11 COM, 12 NC, 14 NO)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S5',
      width: 60,
      height: 50,
      ports: [
        { name: '11', portNumber: 1, type: 'electrical', side: 'bottom', offset: 0.5 },
        { name: '12', portNumber: 2, type: 'electrical', side: 'top', offset: 0.3 },
        { name: '14', portNumber: 3, type: 'electrical', side: 'top', offset: 0.7 }
      ],
      defaultProperties: { contactType: 'changeover', isDetent: false, state: 'nc' }
    },
    {
      id: 'button-changeover-detent',
      name: 'Tombol Detent Changeover',
      description: 'Detent switch changeover / SPDT latching (Pin 11 COM, 12 NC, 14 NO)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'S6',
      width: 60,
      height: 50,
      ports: [
        { name: '11', portNumber: 1, type: 'electrical', side: 'bottom', offset: 0.5 },
        { name: '12', portNumber: 2, type: 'electrical', side: 'top', offset: 0.3 },
        { name: '14', portNumber: 3, type: 'electrical', side: 'top', offset: 0.7 }
      ],
      defaultProperties: { contactType: 'changeover', isDetent: true, state: 'nc' }
    },
    {
      id: 'relay',
      name: 'Relai Kontrol (K1)',
      description: 'Kumparan relai elektromagnetik (Terminal A1-A2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K1',
      width: 50,
      height: 50,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { relayId: 'K1', relayRef: 'K1', state: 'de-energized' }
    },
    {
      id: 'relay-contact-no',
      name: 'Kontak Relai NO',
      description: 'Kontak bantu Normally Open relai (Pin 13-14)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K1-1',
      width: 60,
      height: 40,
      ports: [
        { name: '13', portNumber: 1, type: 'electrical', side: 'left', offset: 0.5 },
        { name: '14', portNumber: 2, type: 'electrical', side: 'right', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NO', relayRef: 'K1', state: 'open' }
    },
    {
      id: 'relay-contact-nc',
      name: 'Kontak Relai NC',
      description: 'Kontak bantu Normally Closed relai (Pin 21-22)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K1-2',
      width: 60,
      height: 40,
      ports: [
        { name: '21', portNumber: 1, type: 'electrical', side: 'left', offset: 0.5 },
        { name: '22', portNumber: 2, type: 'electrical', side: 'right', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NC', relayRef: 'K1', state: 'closed' }
    },
    {
      id: 'timer-on-delay',
      name: 'Relai Timer On-Delay',
      description: 'Relai penunda waktu hidup / Switch-On Delay (Terminal A1-A2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K2',
      width: 50,
      height: 50,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { timeSec: 5, relayRef: 'K2', relayId: 'K2', state: 'de-energized' }
    },
    {
      id: 'timer-off-delay',
      name: 'Relai Timer Off-Delay',
      description: 'Relai penunda waktu mati / Switch-Off Delay (Terminal A1-A2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K3',
      width: 50,
      height: 50,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { timeSec: 5, relayRef: 'K3', relayId: 'K3', state: 'de-energized' }
    },
    {
      id: 'counter',
      name: 'Relai Counter (Pencacah)',
      description: 'Relai counter elektropneumatik dengan reset (A1-A2, R1-R2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'K4',
      width: 60,
      height: 50,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.3 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.3 },
        { name: 'R1', portNumber: 3, type: 'electrical', side: 'top', offset: 0.7 },
        { name: 'R2', portNumber: 4, type: 'electrical', side: 'bottom', offset: 0.7 }
      ],
      defaultProperties: { presetCount: 5, relayRef: 'K4', relayId: 'K4', state: 'de-energized' }
    },
    {
      id: 'solenoid-coil',
      name: 'Kumparan Solenoid (Y1)',
      description: 'Kumparan aktuasi katup pneumatik (Terminal A1-A2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'Y1',
      width: 70,
      height: 50,
      ports: [
        { name: 'A1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'A2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { solenoidRef: 'Y1', state: 'de-energized' }
    },
    {
      id: 'limit-switch',
      name: 'Limit Switch Mekanik',
      description: 'Saklar batas mekanik tuas roller (1S1 / 1S2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: '1S2',
      width: 60,
      height: 45,
      ports: [
        { name: '1', portNumber: 1, type: 'electrical', side: 'left', offset: 0.5 },
        { name: '2', portNumber: 2, type: 'electrical', side: 'right', offset: 0.5 }
      ],
      defaultProperties: { contactType: 'NO', limitSwitchRef: '1S2', state: 'open' }
    },
    {
      id: 'indicator-lamp',
      name: 'Lampu Indikator (H1)',
      description: 'Lampu sinyal status panel kontrol (Terminal X1-X2)',
      category: 'electrical',
      categoryName: 'Elektrikal',
      type: 'electrical',
      defaultLabel: 'H1',
      width: 45,
      height: 45,
      ports: [
        { name: 'X1', portNumber: 1, type: 'electrical', side: 'top', offset: 0.5 },
        { name: 'X2', portNumber: 2, type: 'electrical', side: 'bottom', offset: 0.5 }
      ],
      defaultProperties: { color: 'green', state: 'off' }
    }
  ];

  // 1.6 Category Definitions
  const categories = [
    { id: 'all', name: 'Semua Komponen' },
    { id: 'air-source', name: 'Sumber Udara' },
    { id: 'valve', name: 'Katup Pneumatik' },
    { id: 'actuator', name: 'Aktuator' },
    { id: 'pneumatic-control', name: 'Kendali Pneumatik' },
    { id: 'electrical', name: 'Elektrikal 24V' }
  ];


  // ============================================================
  // 2. SVG SYMBOL GENERATORS (STANDAR ISO 1219-1 & IEC 60617)
  // ============================================================

  // Helper for valve actuator on LEFT side
  function renderActuatorLeftSVG(actType, x, y, h, isActuated = false, props = {}, compWidth = 120) {
    if (actType === 'push-button') {
      const pColor = isActuated ? '#22c55e' : '#ef4444';
      const offset = isActuated ? 4 : 0;
      return `
        <line x1="${x}" y1="${y}" x2="${x - 8 + offset}" y2="${y}" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x - 8 + offset}" y1="${y - 8}" x2="${x - 8 + offset}" y2="${y + 8}" stroke="#1e293b" stroke-width="1.5"/>
        <path d="M${x - 14 + offset},${y - 8} C${x - 9 + offset},${y - 8} ${x - 9 + offset},${y + 8} ${x - 14 + offset},${y + 8} Z" fill="${pColor}" stroke="#1e293b" stroke-width="1.2"/>
      `;
    }
    if (actType === 'roller') {
      const rColor = isActuated ? '#22c55e' : '#f8fafc';
      return `
        <line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="${x - 13}" cy="${y}" r="5" fill="${rColor}" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="${x - 13}" cy="${y}" r="1.5" fill="#1e293b"/>
      `;
    }
    if (actType === 'solenoid') {
      const solFill = isActuated ? '#ef4444' : '#3b82f6';
      const solOp = isActuated ? '0.85' : '0.25';
      const tag = props.solenoidRef || 'Y1';
      return `
        <rect x="${x - 18}" y="${y - 10}" width="18" height="20" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x - 18}" y1="${y - 10}" x2="${x}" y2="${y + 10}" stroke="#1e293b" stroke-width="1.5"/>
        <polygon points="${x - 18},${y - 10} ${x},${y + 10} ${x},${y - 10}" fill="${solFill}" opacity="${solOp}"/>
        <text x="${x - 9}" y="${y + 16}" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2" paint-order="stroke fill" text-anchor="middle">${tag}</text>
      `;
    }
    if (actType === 'pilot') {
      const pilotFill = isActuated ? '#1e293b' : 'none';
      const portX = -compWidth / 2; // Titik pusat marker port 14(Z)
      return `
        <polygon points="${x},${y - 7} ${x - 11},${y} ${x},${y + 7}" fill="${pilotFill}" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x - 11}" y1="${y}" x2="${portX}" y2="${y}" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="${portX}" cy="${y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <text x="${x - 17}" y="${y - 8}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="middle">14</text>
      `;
    }
    if (actType === 'lever') {
      return `
        <line x1="${x}" y1="${y}" x2="${x - 8}" y2="${y}" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x - 8}" y1="${y}" x2="${x - 16}" y2="${y - 12}" stroke="#1e293b" stroke-width="2"/>
        <circle cx="${x - 16}" cy="${y - 12}" r="3" fill="#1e293b"/>
      `;
    }
    return '';
  }

  // Helper for valve actuator on RIGHT side
  function renderActuatorRightSVG(actType, x, y, h, isActuated = false, props = {}, compWidth = 120) {
    if (actType === 'spring') {
      return `
        <path d="M${x},${y} L${x + 3},${y - 6} L${x + 6},${y + 6} L${x + 9},${y - 6} L${x + 12},${y + 6} L${x + 15},${y}" fill="none" stroke="#1e293b" stroke-width="1.5"/>
      `;
    }
    if (actType === 'solenoid') {
      const solFill = isActuated ? '#ef4444' : '#3b82f6';
      const solOp = isActuated ? '0.85' : '0.25';
      const tag = props.solenoidRefRight || 'Y2';
      return `
        <rect x="${x}" y="${y - 10}" width="18" height="20" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x}" y1="${y - 10}" x2="${x + 18}" y2="${y + 10}" stroke="#1e293b" stroke-width="1.5"/>
        <polygon points="${x},${y - 10} ${x + 18},${y + 10} ${x + 18},${y - 10}" fill="${solFill}" opacity="${solOp}"/>
        <text x="${x + 9}" y="${y + 16}" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2" paint-order="stroke fill" text-anchor="middle">${tag}</text>
      `;
    }
    if (actType === 'pilot') {
      const pilotFill = isActuated ? '#0284c7' : 'none';
      const portX = compWidth / 2;
      return `
        <polygon points="${x},${y - 7} ${x + 11},${y} ${x},${y + 7}" fill="${pilotFill}" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${x + 11}" y1="${y}" x2="${portX}" y2="${y}" stroke="#0284c7" stroke-width="1.8"/>
        <text x="${x + 19}" y="${y - 8}" class="port-label-iso port-label-pilot" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#0284c7" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="middle">12</text>
      `;
    }
    return '';
  }

  // 2.1 Compressor Symbol (ISO 1219-1)
  function createCompressorSymbol(w, h, properties = {}, dyn = {}) {
    const isRunning = dyn.running !== false;
    const arrowFill = isRunning ? '#0284c7' : '#1e293b';
    return `
      <!-- Bodi Kompresor (Lingkaran Utama) -->
      <circle cx="0" cy="4" r="18" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
      <!-- Segitiga Arah Aliran Udara ISO 1219 -->
      <polygon points="0,-14 -10,6 10,6" fill="${arrowFill}" stroke="#1e293b" stroke-width="1"/>
      <!-- Indikator Tekanan 6.0 bar -->
      <text x="0" y="24" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#0284c7" text-anchor="middle">6.0 bar</text>
      <!-- Saluran outlet atas menghubungkan ke port 1 -->
      <line x1="0" y1="-14" x2="0" y2="-30" stroke="#1e293b" stroke-width="2.5"/>
    `;
  }

  // 2.2 FRL Unit Symbol (ISO 1219-1)
  function createFRLSymbol(w, h, properties = {}, dyn = {}) {
    const hasPressure = dyn.pressurized || false;
    const lineStroke = hasPressure ? '#0284c7' : '#1e293b';
    return `
      <!-- Kotak garis putus-putus FRL (Kesatuan Unit FRL) -->
      <rect x="-36" y="-18" width="72" height="36" rx="3" fill="#ffffff" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3,3"/>
      <!-- Saluran aliran utama horizontal -->
      <line x1="-36" y1="0" x2="36" y2="0" stroke="${lineStroke}" stroke-width="2"/>
      
      <!-- Filter (Kiri) -->
      <g transform="translate(-20, 0)">
        <rect x="-7" y="-7" width="14" height="14" fill="#f8fafc" stroke="#1e293b" stroke-width="1.2" transform="rotate(45)"/>
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#1e293b" stroke-width="1" stroke-dasharray="1.5,1.5"/>
      </g>
      
      <!-- Regulator dengan Manometer (Tengah) -->
      <g transform="translate(0, 0)">
        <circle cx="0" cy="0" r="7" fill="#f8fafc" stroke="#1e293b" stroke-width="1.2"/>
        <line x1="-5" y1="5" x2="5" y2="-5" stroke="#1e293b" stroke-width="1.2"/>
        <polygon points="5,-5 2,-5 5,-2" fill="#1e293b"/>
      </g>
      
      <!-- Lubricator (Kanan) -->
      <g transform="translate(20, 0)">
        <circle cx="0" cy="0" r="7" fill="#f8fafc" stroke="#1e293b" stroke-width="1.2"/>
        <path d="M0,-3 C-2,0 -2,3 0,4 C2,3 2,0 0,-3 Z" fill="#1e293b"/>
      </g>
      
      <!-- Saluran masuk port 1 (bawah) -->
      <line x1="-16" y1="18" x2="-16" y2="25" stroke="#1e293b" stroke-width="2"/>
      <line x1="-16" y1="0" x2="-16" y2="18" stroke="${lineStroke}" stroke-width="1.8"/>
      
      <!-- Saluran keluar port 2 (atas) -->
      <line x1="16" y1="-18" x2="16" y2="-25" stroke="#1e293b" stroke-width="2"/>
      <line x1="16" y1="0" x2="16" y2="-18" stroke="${lineStroke}" stroke-width="1.8"/>
    `;
  }

  // 2.3 Valve 3/2 Symbol (Festo FluidSIM Exact Specification)
  function createValve32Symbol(w, h, properties = {}, dyn = {}) {
    const actLeft = properties.actuationLeft || 'push-button';
    const actRight = properties.actuationRight || 'spring';
    const isActuated = dyn.isActuated || false;

    const width = w || 100;
    const height = h || 60;
    const halfW = width / 2;
    const halfH = height / 2;

    // Exact Port Coordinates matching getPortPosition()
    // Port 2(A): top, offset 0.62 (x = -halfW + width * 0.62, y = -halfH)
    const p2 = { x: -halfW + width * 0.62, y: -halfH };
    // Port 1(P): bottom, offset 0.62 (x = -halfW + width * 0.62, y = halfH)
    const p1 = { x: -halfW + width * 0.62, y: halfH };
    // Port 3(R): bottom, offset 0.87 (x = -halfW + width * 0.87, y = halfH)
    const p3 = { x: -halfW + width * 0.87, y: halfH };

    // Box dimensions: full width spans x from -halfW to +halfW, height = 40 (y from -20 to +20)
    // Center divider at x = 0 (offset 0.50)
    const boxY = -20;
    const boxH = 40;
    const boxBottom = boxY + boxH; // +20

    // Internal geometry fractions from reference:
    // Left box (actuated): x in [0.00, 0.50] -> x in [-halfW, 0]
    // - Arrow vertical at x 0.12 (from bottom to top, arrowhead full at top)
    const arrowLeftX = -halfW + width * 0.12;
    // - T-stop at x 0.37 (at bottom, stem short from box bottom)
    const tStopLeftX = -halfW + width * 0.37;

    // Right box (normal NC): x in [0.50, 1.00] -> x in [0, +halfW]
    // - T-stop at x 0.62 (at bottom, closes pipe 1)
    const tStopRightX = -halfW + width * 0.62;
    // - Diagonal arrow from top-left (near port 2 at x 0.62) to bottom-right (port 3 at x 0.87)
    const diagStartX = -halfW + width * 0.62;
    const diagEndX = -halfW + width * 0.87;

    return `
      <!-- Kotak Utama FluidSIM: Garis hitam tipis, isi putih/transparan (x 0.00-1.00, y 0.00-1.00) -->
      <rect x="${-halfW}" y="${boxY}" width="${halfW}" height="${boxH}" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      <rect x="0" y="${boxY}" width="${halfW}" height="${boxH}" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      
      <!-- Kotak Kiri (Aktif): Panah tegak lurus dari bawah ke atas di x 0.12 -->
      <line x1="${arrowLeftX}" y1="${boxBottom}" x2="${arrowLeftX}" y2="${boxY + 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${arrowLeftX},${boxY} ${arrowLeftX - 3},${boxY + 6.5} ${arrowLeftX + 3},${boxY + 6.5}" fill="#1e293b"/>
      <!-- Kotak Kiri: Tanda T di bawah di x 0.37 -->
      <line x1="${tStopLeftX}" y1="${boxBottom}" x2="${tStopLeftX}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <line x1="${tStopLeftX - 5}" y1="${boxBottom - 8}" x2="${tStopLeftX + 5}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      
      <!-- Kotak Kanan (Normal NC): Tanda T di bawah di x 0.62 menutup pipa 1 -->
      <line x1="${tStopRightX}" y1="${boxBottom}" x2="${tStopRightX}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <line x1="${tStopRightX - 5}" y1="${boxBottom - 8}" x2="${tStopRightX + 5}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <!-- Kotak Kanan: Panah diagonal dari sudut atas-kiri (x 0.62) ke bawah-kanan (x 0.87) -->
      <line x1="${diagStartX}" y1="${boxY}" x2="${diagEndX - 2.5}" y2="${boxBottom - 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${diagEndX},${boxBottom} ${diagEndX - 6.5},${boxBottom - 4} ${diagEndX - 2},${boxBottom - 9.5}" fill="#1e293b"/>
      
      <!-- Pipa Port Eksternal TEPAT ke Titik Pusat Port Marker (Jarak = 0.0px) -->
      <!-- Port 2(A) atas di x 0.62 -->
      <line x1="${p2.x}" y1="${boxY}" x2="${p2.x}" y2="${p2.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 1(P) bawah di x 0.62 -->
      <line x1="${p1.x}" y1="${boxBottom}" x2="${p1.x}" y2="${p1.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 3(R) bawah di x 0.87 -->
      <line x1="${p3.x}" y1="${boxBottom}" x2="${p3.x}" y2="${p3.y}" stroke="#1e293b" stroke-width="1.5"/>

      <!-- Lingkaran Kecil Terbuka Port FluidSIM di Ujung Pipa (Radius 3.5px, Fill Putih, Stroke Gelap) -->
      <circle cx="${p2.x}" cy="${p2.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p1.x}" cy="${p1.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p3.x}" cy="${p3.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Angka Port Gelap (#1e293b) Sesuai Acuan FluidSIM -->
      <text x="${p2.x - 8}" y="${p2.y + 6}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">2</text>
      <text x="${p1.x - 8}" y="${p1.y - 4}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">1</text>
      <text x="${p3.x + 8}" y="${p3.y - 4}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="start">3</text>
      
      <!-- Aktuasi Kiri & Kanan (FluidSIM Style) -->
      ${renderActuatorLeftSVG(actLeft, -halfW, 0, boxH, isActuated, properties, width)}
      ${renderActuatorRightSVG(actRight, halfW, 0, boxH, false, properties, width)}
    `;
  }

  // 2.4 Valve 5/2 Symbol (Festo FluidSIM Exact Specification)
  function createValve52Symbol(w, h, properties = {}, dyn = {}) {
    const actLeft = properties.actuationLeft || 'push-button';
    const actRight = properties.actuationRight || 'spring';
    const isActuated = dyn.isActuated || false;

    const width = w || 120;
    const height = h || 60;
    const halfW = width / 2;
    const halfH = height / 2;

    // Exact Port Coordinates matching getPortPosition()
    // Port 4(B): top, offset 0.58
    const p4 = { x: -halfW + width * 0.58, y: -halfH };
    // Port 2(A): top, offset 0.92
    const p2 = { x: -halfW + width * 0.92, y: -halfH };
    // Port 5(S): bottom, offset 0.58
    const p5 = { x: -halfW + width * 0.58, y: halfH };
    // Port 1(P): bottom, offset 0.75
    const p1 = { x: -halfW + width * 0.75, y: halfH };
    // Port 3(R): bottom, offset 0.92
    const p3 = { x: -halfW + width * 0.92, y: halfH };

    // Box dimensions: full width spans x from -halfW to +halfW, height = 40 (y from -20 to +20)
    // Center divider at x = 0 (offset 0.50)
    const boxY = -20;
    const boxH = 40;
    const boxBottom = boxY + boxH; // +20

    // Internal geometry fractions from reference:
    // Left box (actuated): x in [0.00, 0.50] -> x in [-halfW, 0]
    // - Panah diagonal dari bawah di x 0.25 ke atas-kiri di x 0.10 (ujung penuh di atas)
    const arrowDiagLeftStartX = -halfW + width * 0.25;
    const arrowDiagLeftEndX = -halfW + width * 0.10;
    // - Tanda T di bawah di x 0.09
    const tStopLeftX = -halfW + width * 0.09;
    // - Panah tegak lurus dari atas ke bawah di x 0.42 (ujung penuh di bawah)
    const arrowVertLeftX = -halfW + width * 0.42;

    // Right box (normal): x in [0.50, 1.00] -> x in [0, +halfW]
    // - Panah tegak lurus dari atas ke bawah di x 0.58 (dari port 4 ke port 5, ujung penuh di bawah)
    const arrowVertRightX = -halfW + width * 0.58;
    // - Panah diagonal dari bawah di x 0.75 (port 1) ke atas-kanan di x 0.92 (port 2, ujung penuh di atas)
    const arrowDiagRightStartX = -halfW + width * 0.75;
    const arrowDiagRightEndX = -halfW + width * 0.92;
    // - Tanda T di bawah di x 0.92 (menutup port 3)
    const tStopRightX = -halfW + width * 0.92;

    return `
      <!-- Kotak Utama FluidSIM: Garis hitam tipis, isi putih/transparan (x 0.00-1.00, y 0.00-1.00) -->
      <rect x="${-halfW}" y="${boxY}" width="${halfW}" height="${boxH}" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      <rect x="0" y="${boxY}" width="${halfW}" height="${boxH}" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      
      <!-- Kotak Kiri (Aktif): -->
      <!-- Panah diagonal dari bawah di x 0.25 ke atas-kiri di x 0.10 (ujung penuh di atas) -->
      <line x1="${arrowDiagLeftStartX}" y1="${boxBottom}" x2="${arrowDiagLeftEndX + 2.5}" y2="${boxY + 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${arrowDiagLeftEndX},${boxY} ${arrowDiagLeftEndX + 2},${boxY + 9.5} ${arrowDiagLeftEndX + 6.5},${boxY + 4}" fill="#1e293b"/>
      <!-- Tanda T di bawah di x 0.09 -->
      <line x1="${tStopLeftX}" y1="${boxBottom}" x2="${tStopLeftX}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <line x1="${tStopLeftX - 5}" y1="${boxBottom - 8}" x2="${tStopLeftX + 5}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <!-- Panah tegak lurus dari atas ke bawah di x 0.42 (ujung penuh di bawah) -->
      <line x1="${arrowVertLeftX}" y1="${boxY}" x2="${arrowVertLeftX}" y2="${boxBottom - 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${arrowVertLeftX},${boxBottom} ${arrowVertLeftX - 3},${boxBottom - 6.5} ${arrowVertLeftX + 3},${boxBottom - 6.5}" fill="#1e293b"/>
      
      <!-- Kotak Kanan (Normal): -->
      <!-- Panah tegak lurus dari atas ke bawah di x 0.58 (dari port 4 ke port 5, ujung penuh di bawah) -->
      <line x1="${arrowVertRightX}" y1="${boxY}" x2="${arrowVertRightX}" y2="${boxBottom - 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${arrowVertRightX},${boxBottom} ${arrowVertRightX - 3},${boxBottom - 6.5} ${arrowVertRightX + 3},${boxBottom - 6.5}" fill="#1e293b"/>
      <!-- Panah diagonal dari bawah di x 0.75 ke atas-kanan di x 0.92 (ujung penuh di atas) -->
      <line x1="${arrowDiagRightStartX}" y1="${boxBottom}" x2="${arrowDiagRightEndX - 2.5}" y2="${boxY + 6.5}" stroke="#1e293b" stroke-width="1.6"/>
      <polygon points="${arrowDiagRightEndX},${boxY} ${arrowDiagRightEndX - 6.5},${boxY + 4} ${arrowDiagRightEndX - 2},${boxY + 9.5}" fill="#1e293b"/>
      <!-- Tanda T di bawah di x 0.92 (menutup port 3) -->
      <line x1="${tStopRightX}" y1="${boxBottom}" x2="${tStopRightX}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      <line x1="${tStopRightX - 5}" y1="${boxBottom - 8}" x2="${tStopRightX + 5}" y2="${boxBottom - 8}" stroke="#1e293b" stroke-width="1.4"/>
      
      <!-- Pipa Port Eksternal TEPAT ke Titik Pusat Port Marker (Jarak = 0.0px) -->
      <!-- Port 4(B) di atas di x 0.58 -->
      <line x1="${p4.x}" y1="${boxY}" x2="${p4.x}" y2="${p4.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 2(A) di atas di x 0.92 -->
      <line x1="${p2.x}" y1="${boxY}" x2="${p2.x}" y2="${p2.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 5(S) di bawah di x 0.58 -->
      <line x1="${p5.x}" y1="${boxBottom}" x2="${p5.x}" y2="${p5.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 1(P) di bawah di x 0.75 -->
      <line x1="${p1.x}" y1="${boxBottom}" x2="${p1.x}" y2="${p1.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 3(R) di bawah di x 0.92 -->
      <line x1="${p3.x}" y1="${boxBottom}" x2="${p3.x}" y2="${p3.y}" stroke="#1e293b" stroke-width="1.5"/>

      <!-- Lingkaran Kecil Terbuka Port FluidSIM di Ujung Pipa (Radius 3.5px, Fill Putih, Stroke Gelap) -->
      <circle cx="${p4.x}" cy="${p4.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p2.x}" cy="${p2.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p5.x}" cy="${p5.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p1.x}" cy="${p1.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p3.x}" cy="${p3.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Angka Port Gelap (#1e293b) Sesuai Acuan FluidSIM -->
      <text x="${p4.x - 8}" y="${p4.y + 6}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">4</text>
      <text x="${p2.x + 8}" y="${p2.y + 6}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="start">2</text>
      <text x="${p5.x - 8}" y="${p5.y - 4}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">5</text>
      <text x="${p1.x}" y="${p1.y - 4}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="middle">1</text>
      <text x="${p3.x + 8}" y="${p3.y - 4}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="start">3</text>
      
      <!-- Aktuasi Kiri & Kanan (FluidSIM Style) -->
      ${renderActuatorLeftSVG(actLeft, -halfW, 0, boxH, dyn.isActuatedLeft || isActuated, properties, width)}
      ${renderActuatorRightSVG(actRight, halfW, 0, boxH, dyn.isActuatedRight || false, properties, width)}
    `;
  }

  // 2.5 Valve 5/3 Symbol (Festo FluidSIM Style & ISO 1219-1 Precise Alignment)
  function createValve53Symbol(w, h, properties = {}, dyn = {}) {
    const actLeft = properties.actuationLeft || 'solenoid';
    const actRight = properties.actuationRight || 'solenoid';

    const width = w || 150;
    const height = h || 60;
    const halfW = width / 2;
    const halfH = height / 2;

    // Exact Port Coordinates matching getPortPosition()
    // Port 4(B): top left (offset 0.3 -> x = -30, y = -30)
    const p4 = { x: -halfW + width * 0.3, y: -halfH };
    // Port 2(A): top right (offset 0.7 -> x = 30, y = -30)
    const p2 = { x: -halfW + width * 0.7, y: -halfH };
    // Port 5(S): bottom left exhaust (offset 0.2 -> x = -45, y = 30)
    const p5 = { x: -halfW + width * 0.2, y: halfH };
    // Port 1(P): bottom center input (offset 0.5 -> x = 0, y = 30)
    const p1 = { x: -halfW + width * 0.5, y: halfH };
    // Port 3(R): bottom right exhaust (offset 0.8 -> x = 45, y = 30)
    const p3 = { x: -halfW + width * 0.8, y: halfH };

    return `
      <!-- 3 Kotak Posisi FluidSIM (Kiri, Tengah, Kanan) -->
      <rect x="-45" y="-16" width="30" height="32" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      <rect x="-15" y="-16" width="30" height="32" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      <rect x="15" y="-16" width="30" height="32" fill="#ffffff" stroke="#1e293b" stroke-width="1.4"/>
      
      <!-- Posisi Tengah: Closed Center FluidSIM (Semua port tertutup T) -->
      <line x1="-7" y1="-16" x2="-7" y2="-9" stroke="#1e293b" stroke-width="1.3"/>
      <line x1="-11" y1="-9" x2="-3" y2="-9" stroke="#1e293b" stroke-width="1.3"/>
      <line x1="7" y1="-16" x2="7" y2="-9" stroke="#1e293b" stroke-width="1.3"/>
      <line x1="3" y1="-9" x2="11" y2="-9" stroke="#1e293b" stroke-width="1.3"/>
      <line x1="0" y1="16" x2="0" y2="9" stroke="#1e293b" stroke-width="1.3"/>
      <line x1="-5" y1="9" x2="5" y2="9" stroke="#1e293b" stroke-width="1.3"/>

      <!-- Posisi Kiri: 1 -> 4 & 2 -> 3 -->
      <line x1="-23" y1="16" x2="-37" y2="-11" stroke="#1e293b" stroke-width="1.5"/>
      <polygon points="-37,-15 -40,-10 -34,-10" fill="#1e293b"/>
      <line x1="-23" y1="-16" x2="-37" y2="11" stroke="#1e293b" stroke-width="1.3"/>
      <polygon points="-37,15 -40,10 -34,10" fill="#1e293b"/>

      <!-- Posisi Kanan: 1 -> 2 & 4 -> 5 -->
      <line x1="23" y1="16" x2="37" y2="-11" stroke="#1e293b" stroke-width="1.5"/>
      <polygon points="37,-15 34,-10 40,-10" fill="#1e293b"/>
      <line x1="23" y1="-16" x2="37" y2="11" stroke="#1e293b" stroke-width="1.3"/>
      <polygon points="37,15 34,10 40,10" fill="#1e293b"/>
      
      <!-- Pipa Pendek Eksternal TEPAT ke Titik Pusat Port Marker (Jarak = 0.0px) -->
      <!-- Port 4(B) di atas kiri -->
      <line x1="${p4.x}" y1="-16" x2="${p4.x}" y2="${p4.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 2(A) di atas kanan -->
      <line x1="${p2.x}" y1="-16" x2="${p2.x}" y2="${p2.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 1(P) di bawah tengah -->
      <line x1="${p1.x}" y1="16" x2="${p1.x}" y2="${p1.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 5(S) di bawah kiri exhaust -->
      <line x1="${p5.x}" y1="16" x2="${p5.x}" y2="${p5.y}" stroke="#1e293b" stroke-width="1.5"/>
      <!-- Port 3(R) di bawah kanan exhaust -->
      <line x1="${p3.x}" y1="16" x2="${p3.x}" y2="${p3.y}" stroke="#1e293b" stroke-width="1.5"/>

      <!-- Lingkaran Kecil Terbuka Port FluidSIM (Radius 3.5px, Fill Putih, Stroke Gelap) -->
      <circle cx="${p4.x}" cy="${p4.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p2.x}" cy="${p2.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p5.x}" cy="${p5.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p1.x}" cy="${p1.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="${p3.x}" cy="${p3.y}" r="3.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>

      <!-- Label Angka Port Gelap (#1e293b) Dekat Lingkaran Port Standar FluidSIM -->
      <text x="${p4.x + 8}" y="${p4.y + 14}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="start">4</text>
      <text x="${p2.x - 8}" y="${p2.y + 14}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">2</text>
      <text x="${p5.x + 8}" y="${p5.y - 7}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="start">5</text>
      <text x="${p1.x - 7}" y="${p1.y - 7}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">1</text>
      <text x="${p3.x - 7}" y="${p3.y - 7}" class="port-label-iso" font-size="9.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#1e293b" stroke="#ffffff" stroke-width="2.5" paint-order="stroke fill" text-anchor="end">3</text>

      <!-- Aktuasi Kiri & Kanan -->
      ${renderActuatorLeftSVG(actLeft, -45, 0, 32, dyn.isActuatedLeft || false, properties, width)}
      ${renderActuatorRightSVG(actRight, 45, 0, 32, dyn.isActuatedRight || false, properties, width)}
    `;
  }

  // 2.6 Single-Acting Cylinder Symbol (ANIMATED PISTON & COMPRESSIBLE SPRING)
  function createCylinderSingleSymbol(w, h, properties = {}, dyn = {}) {
    const pos = Math.max(0, Math.min(1, dyn.pistonPos !== undefined ? dyn.pistonPos : 0.0));
    const isPressurized = dyn.chamberA || false;

    // Piston offset: 0.0 (retracted, x = -38) to 1.0 (extended, x = 6)
    const pistonX = -38 + pos * 44;
    const chamberWidth = Math.max(0, pistonX - (-48));
    const rodEndX = pistonX + 7 + 42; // Clevis tip position

    // Dynamically calculate compressible spring zigzag between (pistonX + 7) and cylinder end (x = 16)
    const springStartX = pistonX + 7;
    const springEndX = 16;
    const springSpan = Math.max(4, springEndX - springStartX);
    const segs = 7;
    const step = springSpan / segs;
    let springPath = `M${springStartX},0`;
    for (let i = 1; i < segs; i++) {
      const sx = springStartX + i * step;
      const sy = (i % 2 === 1) ? -6 : 6;
      springPath += ` L${sx},${sy}`;
    }
    springPath += ` L${springEndX},0`;

    return `
      <!-- Tabung Silinder Kerja Tunggal ISO 1219 -->
      <rect x="-50" y="-16" width="66" height="32" rx="2" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Ruang Tekanan Udara (Chamber Kiri) -->
      <rect class="cyl-chamber-left" x="-48" y="-14" width="${chamberWidth}" height="28" fill="#bae6fd" opacity="${isPressurized ? 0.85 : 0.15}"/>
      
      <!-- Piston Silinder (Biru Metalik) -->
      <rect class="cyl-piston" x="${pistonX}" y="-14" width="7" height="28" fill="#2563eb" stroke="#1e293b" stroke-width="1.2"/>
      
      <!-- Batang Piston Menjulur ke Kanan -->
      <line class="cyl-rod" x1="${pistonX + 7}" y1="0" x2="${rodEndX}" y2="0" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Ujung Batang Piston (Clevis) -->
      <circle class="cyl-clevis" cx="${rodEndX + 1}" cy="0" r="3.5" fill="#f8fafc" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Pegas Pembalik (Spring Zigzag) Kompresibel -->
      <path class="cyl-spring" d="${springPath}" fill="none" stroke="#64748b" stroke-width="1.4"/>
      
      <!-- Tutup kanan silinder -->
      <line x1="16" y1="-16" x2="16" y2="-4" stroke="#1e293b" stroke-width="2"/>
      <line x1="16" y1="4" x2="16" y2="16" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Saluran port masuk (bottom left) -->
      <line x1="-30" y1="16" x2="-30" y2="25" stroke="#1e293b" stroke-width="2"/>
      <text x="-30" y="23" font-size="7" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">IN</text>
      
      <!-- Digital Position Readout (0% - 100%) -->
      <text class="cyl-pos-badge" x="-17" y="-20" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#0284c7" text-anchor="middle">${Math.round(pos * 100)}%</text>
    `;
  }

  // 2.7 Double-Acting Cylinder Symbol (ANIMATED PISTON & DUAL CHAMBERS)
  function createCylinderDoubleSymbol(w, h, properties = {}, dyn = {}) {
    const pos = Math.max(0, Math.min(1, dyn.pistonPos !== undefined ? dyn.pistonPos : 0.0));
    const isPresA = dyn.chamberA || false;
    const isPresB = dyn.chamberB || false;

    // Piston offset: 0.0 (retracted, x = -38) to 1.0 (extended, x = 15)
    const pistonX = -38 + pos * 53;
    const chamberAWidth = Math.max(0, pistonX - (-48));
    const chamberBWidth = Math.max(0, 23 - (pistonX + 8));
    const rodEndX = pistonX + 8 + 44; // Clevis tip position

    return `
      <!-- Tabung Silinder Kerja Ganda ISO 1219 -->
      <rect x="-50" y="-16" width="75" height="32" rx="2" fill="#ffffff" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Ruang Tekanan A (Cap End - Sisi Belakang Piston) -->
      <rect class="cyl-chamber-a" x="-48" y="-14" width="${chamberAWidth}" height="28" fill="#bae6fd" opacity="${isPresA ? 0.9 : 0.1}"/>
      
      <!-- Ruang Tekanan B (Rod End - Sisi Depan Piston) -->
      <rect class="cyl-chamber-b" x="${pistonX + 8}" y="-14" width="${chamberBWidth}" height="28" fill="#bae6fd" opacity="${isPresB ? 0.9 : 0.1}"/>
      
      <!-- Piston Silinder -->
      <rect class="cyl-piston" x="${pistonX}" y="-14" width="8" height="28" fill="#2563eb" stroke="#1e293b" stroke-width="1.2"/>
      
      <!-- Batang Piston Menjulur ke Kanan -->
      <line class="cyl-rod" x1="${pistonX + 8}" y1="0" x2="${rodEndX}" y2="0" stroke="#1e293b" stroke-width="4.5" stroke-linecap="round"/>
      <!-- Ujung Batang Piston (Clevis) -->
      <circle class="cyl-clevis" cx="${rodEndX + 2}" cy="0" r="3.5" fill="#f8fafc" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Tutup kanan silinder dengan lubang batang -->
      <line x1="25" y1="-16" x2="25" y2="-4" stroke="#1e293b" stroke-width="2"/>
      <line x1="25" y1="4" x2="25" y2="16" stroke="#1e293b" stroke-width="2"/>
      
      <!-- Dua Saluran Port Masuk (A = Maju, B = Mundur) -->
      <line x1="-30" y1="16" x2="-30" y2="25" stroke="#1e293b" stroke-width="2"/>
      <line x1="15" y1="16" x2="15" y2="25" stroke="#1e293b" stroke-width="2"/>
      <line x1="15" y1="25" x2="30" y2="25" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="1,1"/>
      <text x="-30" y="23" font-size="7" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">A</text>
      <text x="30" y="23" font-size="7" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">B</text>
      
      <!-- Digital Position Readout (0% - 100%) -->
      <text class="cyl-pos-badge" x="-12" y="-20" font-size="8.5" font-family="'JetBrains Mono', monospace" font-weight="bold" fill="#0284c7" text-anchor="middle">${Math.round(pos * 100)}%</text>
      
      <!-- Limit Switch Sensor Markers 1S1 (Retracted 0%) & 1S2 (Extended 100%) -->
      <circle cx="-38" cy="-17" r="2.5" fill="${pos < 0.05 ? '#22c55e' : '#94a3b8'}"/>
      <text x="-38" y="-20" font-size="6.5" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">1S1</text>
      <circle cx="20" cy="-17" r="2.5" fill="${pos > 0.95 ? '#22c55e' : '#94a3b8'}"/>
      <text x="20" y="-20" font-size="6.5" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">1S2</text>
    `;
  }

  // 2.8 AND Valve Symbol (Dual Pressure Valve)
  function createANDSymbol(w, h, properties = {}, dyn = {}) {
    return `
      <rect x="-18" y="-18" width="36" height="36" rx="2" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="-18" y1="-8" x2="-8" y2="-8" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="-18" y1="8" x2="-8" y2="8" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="8" y1="0" x2="18" y2="0" stroke="#1e293b" stroke-width="1.5"/>
      <rect x="-6" y="-12" width="12" height="24" fill="#f8fafc" stroke="#1e293b" stroke-width="1"/>
      <line x1="0" y1="-12" x2="0" y2="12" stroke="#1e293b" stroke-width="1.5"/>
      <text x="-12" y="-10" font-size="6" fill="#64748b">X</text>
      <text x="-12" y="14" font-size="6" fill="#64748b">Y</text>
      <text x="10" y="-3" font-size="6" fill="#64748b">A</text>
    `;
  }

  // 2.9 OR Valve Symbol (Shuttle Valve)
  function createORSymbol(w, h, properties = {}, dyn = {}) {
    return `
      <rect x="-18" y="-18" width="36" height="36" rx="2" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
      <circle cx="0" cy="0" r="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="-18" y1="-8" x2="-5" y2="-8" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="-18" y1="8" x2="-5" y2="8" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="5" y1="0" x2="18" y2="0" stroke="#1e293b" stroke-width="1.5"/>
      <text x="-12" y="-10" font-size="6" fill="#64748b">X</text>
      <text x="-12" y="14" font-size="6" fill="#64748b">Y</text>
      <text x="10" y="-3" font-size="6" fill="#64748b">A</text>
    `;
  }

  // 2.10 Pilot Line Symbol
  function createPilotLineSymbol(w, h) {
    return `
      <line x1="-18" y1="0" x2="18" y2="0" stroke="#0284c7" stroke-width="2" stroke-dasharray="3,3"/>
      <polygon points="12,-4 18,0 12,4" fill="#0284c7"/>
    `;
  }

  // 2.11 DC Source (+24V Terminal) Symbol (Festo FluidSIM Terminal Style)
  function createDCSourceSymbol(w, h, properties = {}, dyn = {}) {
    const width = w || 32;
    const halfW = width / 2;
    const r = 3.5;
    return `
      <!-- Simbol Terminal FluidSIM +24V (○—○ dengan label +24V di atas) -->
      <line x1="${-halfW}" y1="0" x2="${halfW}" y2="0" stroke="#1e293b" stroke-width="1.6"/>
      <circle cx="${-halfW}" cy="0" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
      <circle cx="${halfW}" cy="0" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
      <text x="0" y="-8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#1e293b" text-anchor="middle">+24V</text>
    `;
  }

  // 2.11b Terminal 0V (Netral / GND) Symbol (Festo FluidSIM Terminal Style)
  function createTerminal0VSymbol(w, h, properties = {}, dyn = {}) {
    const width = w || 32;
    const halfW = width / 2;
    const r = 3.5;
    return `
      <!-- Simbol Terminal FluidSIM 0V (○—○ dengan label 0V di atas) -->
      <line x1="${-halfW}" y1="0" x2="${halfW}" y2="0" stroke="#1e293b" stroke-width="1.6"/>
      <circle cx="${-halfW}" cy="0" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
      <circle cx="${halfW}" cy="0" r="${r}" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
      <text x="0" y="-8" font-family="'Segoe UI', system-ui, -apple-system, sans-serif" font-size="11" font-weight="bold" fill="#1e293b" text-anchor="middle">0V</text>
    `;
  }

  // 2.12 Push Button NO Symbol (Make, Momentary) - Festo FluidSIM Standard
  function createButtonNOSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 3.5 : 0;
    const armX2 = isPressed ? 0 : -7;
    const armY2 = isPressed ? -10 : -8.5;

    return `
      <!-- Terminal Atas (Pin 13) Lurus -->
      <line x1="0" y1="-25" x2="0" y2="-10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah (Pin 14) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal (Berporos di 0, 10) -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Manual Putus-Putus (Bentuk E di Kiri) -->
      <line x1="${-20 + dx}" y1="0" x2="${-3.5 + dx}" y2="0" stroke="${strokeColor}" stroke-width="1.2" stroke-dasharray="2.5,2"/>
      
      <!-- Kepala Pushbutton Bentuk E -->
      <path d="M${-16 + dx},-6 L${-20 + dx},-6 L${-20 + dx},6 L${-16 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
    `;
  }

  // 2.12b Detent Switch NO Symbol (Make, Latching) - Festo FluidSIM Standard
  function createButtonNODetentSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 3.5 : 0;
    const armX2 = isPressed ? 0 : -7;
    const armY2 = isPressed ? -10 : -8.5;

    return `
      <!-- Terminal Atas (Pin 13) Lurus -->
      <line x1="0" y1="-25" x2="0" y2="-10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah (Pin 14) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Detent Pola Titik-Strip (-.-.) -->
      <line x1="${-20 + dx}" y1="0" x2="${-3.5 + dx}" y2="0" stroke="${strokeColor}" stroke-width="${isPressed ? 1.8 : 1.2}" stroke-dasharray="5,2,1.5,2"/>
      
      <!-- Kepala Detent Switch (Latching) Bentuk E -->
      <path d="M${-16 + dx},-6 L${-20 + dx},-6 L${-20 + dx},6 L${-16 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
      
      <!-- Tanda Pengunci Detent Latching (Notch Segitiga) -->
      <polygon points="${-12 + dx},-3.5 ${-9 + dx},0 ${-12 + dx},3.5" fill="${isPressed ? '#1e293b' : 'none'}" stroke="${strokeColor}" stroke-width="1"/>
    `;
  }

  // 2.13 Push Button NC Symbol (Break, Momentary) - Festo FluidSIM Standard
  function createButtonNCSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 3.5 : 0;
    const armX2 = isPressed ? 0 : -6;
    const armY2 = -10;

    return `
      <!-- Terminal Atas (Pin 11) Berbentuk L (Menekuk ke Kiri) -->
      <path d="M0,-25 L0,-10 L-6,-10" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="-6" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah (Pin 12) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal (Berporos di 0, 10) -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Manual Putus-Putus (Bentuk E di Kiri) -->
      <line x1="${-20 + dx}" y1="0" x2="${-3 + dx}" y2="0" stroke="${strokeColor}" stroke-width="1.2" stroke-dasharray="2.5,2"/>
      
      <!-- Kepala Pushbutton Bentuk E -->
      <path d="M${-16 + dx},-6 L${-20 + dx},-6 L${-20 + dx},6 L${-16 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
    `;
  }

  // 2.13b Detent Switch NC Symbol (Break, Latching) - Festo FluidSIM Standard
  function createButtonNCDetentSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 3.5 : 0;
    const armX2 = isPressed ? 0 : -6;
    const armY2 = -10;

    return `
      <!-- Terminal Atas (Pin 11) Berbentuk L (Menekuk ke Kiri) -->
      <path d="M0,-25 L0,-10 L-6,-10" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="-6" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah (Pin 12) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Detent Pola Titik-Strip (-.-.) -->
      <line x1="${-20 + dx}" y1="0" x2="${-3 + dx}" y2="0" stroke="${strokeColor}" stroke-width="${isPressed ? 1.8 : 1.2}" stroke-dasharray="5,2,1.5,2"/>
      
      <!-- Kepala Detent Switch (Latching) Bentuk E -->
      <path d="M${-16 + dx},-6 L${-20 + dx},-6 L${-20 + dx},6 L${-16 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
      
      <!-- Tanda Pengunci Detent Latching -->
      <polygon points="${-12 + dx},-3.5 ${-9 + dx},0 ${-12 + dx},3.5" fill="${isPressed ? '#1e293b' : 'none'}" stroke="${strokeColor}" stroke-width="1"/>
    `;
  }

  // 2.13c Push Button Changeover Symbol (SPDT, Momentary) - Festo FluidSIM Standard
  function createButtonChangeoverSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 4 : 0;
    const armX2 = isPressed ? 12 : -17;
    const armY2 = -10;

    return `
      <!-- Terminal Atas Kiri (Pin 12, NC) Berbentuk L -->
      <path d="M-12,-25 L-12,-10 L-17,-10" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="-17" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Atas Kanan (Pin 14, NO) Lurus -->
      <line x1="12" y1="-25" x2="12" y2="-10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="12" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah Satu (Pin 11, COM) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal (Berporos di COM 0, 10) -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Manual Putus-Putus (Bentuk E di Kiri) -->
      <line x1="${-26 + dx}" y1="0" x2="${(isPressed ? 6 : -8.5) + dx * 0.2}" y2="0" stroke="${strokeColor}" stroke-width="1.2" stroke-dasharray="2.5,2"/>
      
      <!-- Kepala Pushbutton Bentuk E -->
      <path d="M${-22 + dx},-6 L${-26 + dx},-6 L${-26 + dx},6 L${-22 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
    `;
  }

  // 2.13d Detent Switch Changeover Symbol (SPDT, Latching) - Festo FluidSIM Standard
  function createButtonChangeoverDetentSymbol(w, h, properties = {}, dyn = {}) {
    const isPressed = dyn.pressed || false;
    const strokeColor = '#1e293b';
    const strokeW = 1.3;
    const dx = isPressed ? 4 : 0;
    const armX2 = isPressed ? 12 : -17;
    const armY2 = -10;

    return `
      <!-- Terminal Atas Kiri (Pin 12, NC) Berbentuk L -->
      <path d="M-12,-25 L-12,-10 L-17,-10" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="-17" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Atas Kanan (Pin 14, NO) Lurus -->
      <line x1="12" y1="-25" x2="12" y2="-10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="12" cy="-10" r="1.6" fill="#1e293b"/>
      
      <!-- Terminal Bawah Satu (Pin 11, COM) Lurus -->
      <line x1="0" y1="25" x2="0" y2="10" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <circle cx="0" cy="10" r="1.6" fill="#1e293b"/>
      
      <!-- Lengan Kontak Diagonal -->
      <line x1="0" y1="10" x2="${armX2}" y2="${armY2}" stroke="${strokeColor}" stroke-width="1.6"/>
      
      <!-- Batang Aktuator Detent Pola Titik-Strip (-.-.) -->
      <line x1="${-26 + dx}" y1="0" x2="${(isPressed ? 6 : -8.5) + dx * 0.2}" y2="0" stroke="${strokeColor}" stroke-width="${isPressed ? 1.8 : 1.2}" stroke-dasharray="5,2,1.5,2"/>
      
      <!-- Kepala Detent Switch (Latching) Bentuk E -->
      <path d="M${-22 + dx},-6 L${-26 + dx},-6 L${-26 + dx},6 L${-22 + dx},6" fill="none" stroke="${strokeColor}" stroke-width="1.3"/>
      
      <!-- Tanda Pengunci Detent Latching -->
      <polygon points="${-18 + dx},-3.5 ${-15 + dx},0 ${-18 + dx},3.5" fill="${isPressed ? '#1e293b' : 'none'}" stroke="${strokeColor}" stroke-width="1"/>
    `;
  }

  // 2.14 Relay Coil Symbol (K1) - Festo FluidSIM Standard
  function createRelaySymbol(w, h, properties = {}, dyn = {}) {
    const isEnergized = dyn.energized || false;
    const strokeColor = isEnergized ? '#22c55e' : '#1e293b';
    const strokeW = isEnergized ? 2 : 1.5;

    return `
      <!-- Kotak Kumparan Relai FluidSIM (Kotak Polos Putih) -->
      <rect x="-12" y="-16" width="24" height="32" rx="1" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      
      <!-- Pipa Terminal A1 (atas) & A2 (bawah) -->
      <line x1="0" y1="-16" x2="0" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="0" y1="16" x2="0" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Terminal di Luar Kotak -->
      <text x="-6" y="-18" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A1</text>
      <text x="-6" y="23" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A2</text>
    `;
  }

  // 2.15 Relay Contact NO Symbol (Pin 13-14)
  function createRelayContactNOSymbol(w, h, properties = {}, dyn = {}) {
    const isClosed = dyn.closed || false;
    const barAngle = isClosed ? 0 : -25;
    const barColor = isClosed ? '#22c55e' : '#1e293b';

    return `
      <circle cx="-16" cy="0" r="2.5" fill="#1e293b"/>
      <circle cx="16" cy="0" r="2.5" fill="#1e293b"/>
      <line x1="-25" y1="0" x2="-16" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="16" y1="0" x2="25" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      
      <!-- Kontak NO Berputar -->
      <g transform="translate(-16, 0) rotate(${barAngle})">
        <line x1="0" y1="0" x2="32" y2="0" stroke="${barColor}" stroke-width="2.2"/>
      </g>
    `;
  }

  // 2.16 Relay Contact NC Symbol (Pin 21-22)
  function createRelayContactNCSymbol(w, h, properties = {}, dyn = {}) {
    const isOpen = dyn.open || false;
    const barAngle = isOpen ? -25 : 0;
    const barColor = isOpen ? '#ef4444' : '#22c55e';

    return `
      <circle cx="-16" cy="0" r="2.5" fill="#1e293b"/>
      <circle cx="16" cy="0" r="2.5" fill="#1e293b"/>
      <line x1="-25" y1="0" x2="-16" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="16" y1="0" x2="25" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      
      <g transform="translate(-16, 0) rotate(${barAngle})">
        <line x1="0" y1="0" x2="32" y2="0" stroke="${barColor}" stroke-width="2.2"/>
      </g>
    `;
  }

  // 2.17 Solenoid Coil Symbol (Y1) - Festo FluidSIM Standard
  function createSolenoidCoilSymbol(w, h, properties = {}, dyn = {}) {
    const isEnergized = dyn.energized || false;
    const strokeColor = isEnergized ? '#ef4444' : '#1e293b';
    const strokeW = isEnergized ? 2 : 1.5;

    return `
      <!-- Kotak Solenoid FluidSIM dengan Garis Diagonal Kiri Bawah ke Kanan Atas -->
      <rect x="-12" y="-16" width="24" height="32" rx="1" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      <line x1="-12" y1="16" x2="12" y2="-16" stroke="${strokeColor}" stroke-width="1.5"/>
      
      <!-- Pipa Terminal A1 (atas) & A2 (bawah) -->
      <line x1="0" y1="-16" x2="0" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="0" y1="16" x2="0" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Terminal di Luar Kotak -->
      <text x="-6" y="-18" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A1</text>
      <text x="-6" y="23" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A2</text>
      
      <!-- Garis Putus-putus ke Simbol Katup di Sisi Kanan -->
      <line x1="12" y1="0" x2="23" y2="0" stroke="#1e293b" stroke-width="1.2" stroke-dasharray="2.5,2"/>
      
      <!-- Simbol Katup 2 Segitiga (Hourglass) -->
      <polygon points="23,-7 23,7 30,0" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
      <polygon points="37,-7 37,7 30,0" fill="#ffffff" stroke="#1e293b" stroke-width="1.2"/>
    `;
  }

  // 2.17b Timer Switch-On Delay Symbol - Festo FluidSIM Standard
  function createTimerOnDelaySymbol(w, h, properties = {}, dyn = {}) {
    const isEnergized = dyn.energized || false;
    const strokeColor = isEnergized ? '#22c55e' : '#1e293b';
    const strokeW = isEnergized ? 2 : 1.5;
    const timeVal = properties.timeSec !== undefined ? properties.timeSec : 5;

    return `
      <!-- Kotak Utama Timer Switch-On Delay FluidSIM -->
      <rect x="-16" y="-16" width="32" height="32" rx="1" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      
      <!-- Garis Pembagi Kiri dan Kanan -->
      <line x1="-4" y1="-16" x2="-4" y2="16" stroke="#1e293b" stroke-width="1.2"/>
      
      <!-- Tanda Silang (X) di Bagian Kiri -->
      <line x1="-16" y1="-16" x2="-4" y2="16" stroke="#1e293b" stroke-width="1.2"/>
      <line x1="-16" y1="16" x2="-4" y2="-16" stroke="#1e293b" stroke-width="1.2"/>
      
      <!-- Angka Nilai Waktu di Bagian Kanan -->
      <text x="6" y="3.5" font-size="8.5" font-family="'Inter', sans-serif" font-weight="700" fill="#1e293b" text-anchor="middle">${timeVal}s</text>
      
      <!-- Pipa Terminal A1 & A2 -->
      <line x1="0" y1="-16" x2="0" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="0" y1="16" x2="0" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Terminal di Luar Kotak -->
      <text x="-6" y="-18" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A1</text>
      <text x="-6" y="23" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A2</text>
    `;
  }

  // 2.17c Timer Switch-Off Delay Symbol - Festo FluidSIM Standard
  function createTimerOffDelaySymbol(w, h, properties = {}, dyn = {}) {
    const isEnergized = dyn.energized || false;
    const strokeColor = isEnergized ? '#22c55e' : '#1e293b';
    const strokeW = isEnergized ? 2 : 1.5;
    const timeVal = properties.timeSec !== undefined ? properties.timeSec : 5;

    return `
      <!-- Kotak Utama Timer Switch-Off Delay FluidSIM -->
      <rect x="-16" y="-16" width="32" height="32" rx="1" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      
      <!-- Bagian Kiri Terisi Hitam -->
      <rect x="-16" y="-16" width="12" height="32" fill="#1e293b" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Angka Nilai Waktu di Bagian Kanan -->
      <text x="6" y="3.5" font-size="8.5" font-family="'Inter', sans-serif" font-weight="700" fill="#1e293b" text-anchor="middle">${timeVal}s</text>
      
      <!-- Pipa Terminal A1 & A2 -->
      <line x1="0" y1="-16" x2="0" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="0" y1="16" x2="0" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Terminal di Luar Kotak -->
      <text x="-6" y="-18" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A1</text>
      <text x="-6" y="23" font-size="7.5" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A2</text>
    `;
  }

  // 2.17d Relay Counter Symbol - Festo FluidSIM Standard
  function createCounterSymbol(w, h, properties = {}, dyn = {}) {
    const isEnergized = dyn.energized || false;
    const strokeColor = isEnergized ? '#22c55e' : '#1e293b';
    const strokeW = isEnergized ? 2 : 1.5;
    const count = dyn.count !== undefined ? dyn.count : 0;
    const preset = properties.presetCount !== undefined ? properties.presetCount : 5;

    return `
      <!-- Kotak Utama Counter FluidSIM -->
      <rect x="-24" y="-16" width="48" height="32" rx="1" fill="#ffffff" stroke="${strokeColor}" stroke-width="${strokeW}"/>
      
      <!-- Lingkaran Mekanisme di Kiri Bawah (A2) -->
      <circle cx="-12" cy="5" r="5.5" fill="#ffffff" stroke="#1e293b" stroke-width="1.3"/>
      
      <!-- Nilai Hitung di Bagian Kanan (contoh 0/5 atau 3/5) -->
      <text x="8" y="3.5" font-size="9" font-family="'Inter', sans-serif" font-weight="700" fill="#1e293b" text-anchor="middle">${count}/${preset}</text>
      
      <!-- Pipa Terminal A1 & R1 (atas) -->
      <line x1="-12" y1="-16" x2="-12" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="12" y1="-16" x2="12" y2="-25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Pipa Terminal A2 & R2 (bawah) -->
      <line x1="-12" y1="16" x2="-12" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      <line x1="12" y1="16" x2="12" y2="25" stroke="#1e293b" stroke-width="1.5"/>
      
      <!-- Label Terminal di Luar Kotak -->
      <text x="-16" y="-18" font-size="7" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A1</text>
      <text x="16" y="-18" font-size="7" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="start">R1</text>
      <text x="-16" y="23" font-size="7" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="end">A2</text>
      <text x="16" y="23" font-size="7" font-family="'Inter', sans-serif" font-weight="600" fill="#1e293b" text-anchor="start">R2</text>
    `;
  }

  // 2.18 Limit Switch Symbol (Roller Lever)
  function createLimitSwitchSymbol(w, h, properties = {}, dyn = {}) {
    const isTripped = dyn.tripped || false;
    const barAngle = isTripped ? 0 : -25;
    const rollerColor = isTripped ? '#22c55e' : '#f8fafc';

    return `
      <circle cx="-16" cy="0" r="2.5" fill="#1e293b"/>
      <circle cx="16" cy="0" r="2.5" fill="#1e293b"/>
      <line x1="-25" y1="0" x2="-16" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="16" y1="0" x2="25" y2="0" stroke="#1e293b" stroke-width="1.8"/>
      
      <!-- Kontak dengan Roller Lever -->
      <g transform="translate(-16, 0) rotate(${barAngle})">
        <line x1="0" y1="0" x2="28" y2="0" stroke="#1e293b" stroke-width="2"/>
        <line x1="28" y1="0" x2="28" y2="-7" stroke="#1e293b" stroke-width="1.5"/>
        <circle cx="28" cy="-10" r="3.5" fill="${rollerColor}" stroke="#1e293b" stroke-width="1.2"/>
      </g>
      
      <text x="-16" y="11" font-size="7" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">1</text>
      <text x="16" y="11" font-size="7" font-family="'JetBrains Mono', monospace" fill="#64748b" text-anchor="middle">2</text>
    `;
  }

  // 2.19 Indicator Lamp Symbol (H1)
  function createIndicatorLampSymbol(w, h, properties = {}, dyn = {}) {
    const isLit = dyn.lit || false;
    const circleFill = isLit ? '#22c55e' : '#ffffff';
    const circleClass = isLit ? 'lamp-glow-active' : '';

    return `
      <!-- Lingkaran Lampu Standar IEC -->
      <circle cx="0" cy="0" r="14" fill="${circleFill}" stroke="#1e293b" stroke-width="1.8" class="${circleClass}"/>
      <!-- Tanda Silang Lampu -->
      <line x1="-10" y1="-10" x2="10" y2="10" stroke="${isLit ? '#ffffff' : '#1e293b'}" stroke-width="1.5"/>
      <line x1="10" y1="-10" x2="-10" y2="10" stroke="${isLit ? '#ffffff' : '#1e293b'}" stroke-width="1.5"/>
      
      <!-- Terminal X1 (atas) & X2 (bawah) -->
      <line x1="0" y1="-14" x2="0" y2="-22" stroke="#1e293b" stroke-width="1.8"/>
      <line x1="0" y1="14" x2="0" y2="22" stroke="#1e293b" stroke-width="1.8"/>
      <text x="-6" y="-17" font-size="6.5" font-family="'JetBrains Mono', monospace" fill="#64748b">X1</text>
      <text x="-6" y="21" font-size="6.5" font-family="'JetBrains Mono', monospace" fill="#64748b">X2</text>
    `;
  }


  // ============================================================
  // 3. SYMBOL DISPATCHER
  // ============================================================

  function renderComponentSymbol(comp, dyn = {}) {
    const def = getComponentDef(comp.defId);
    if (!def) return '';
    const w = comp.width || def.width;
    const h = comp.height || def.height;
    const props = comp.properties || {};

    switch (comp.defId) {
      case 'compressor':
        return createCompressorSymbol(w, h, props, dyn);
      case 'frl-unit':
        return createFRLSymbol(w, h, props, dyn);
      case 'valve-3-2':
      case 'valve-3-2-push':
      case 'valve-spring':
        return createValve32Symbol(w, h, props, dyn);
      case 'valve-3-2-roller':
        return createValve32Symbol(w, h, Object.assign({}, props, { actuationLeft: 'roller' }), dyn);
      case 'valve-5-2':
        return createValve52Symbol(w, h, props, dyn);
      case 'valve-5-2-pilot':
        return createValve52Symbol(w, h, Object.assign({}, props, { actuationLeft: 'pilot' }), dyn);
      case 'valve-5-2-solenoid':
        return createValve52Symbol(w, h, Object.assign({}, props, { actuationLeft: 'solenoid' }), dyn);
      case 'valve-5-3':
        return createValve53Symbol(w, h, props, dyn);
      case 'cylinder-single':
        return createCylinderSingleSymbol(w, h, props, dyn);
      case 'cylinder-double':
        return createCylinderDoubleSymbol(w, h, props, dyn);
      case 'pneumatic-push-button':
        return createValve32Symbol(w, h, { actuationLeft: 'push-button', actuationRight: 'spring' }, dyn);
      case 'valve-and':
        return createANDSymbol(w, h, props, dyn);
      case 'valve-or':
        return createORSymbol(w, h, props, dyn);
      case 'pilot-line':
        return createPilotLineSymbol(w, h);
      case 'dc-source':
        return createDCSourceSymbol(w, h, props, dyn);
      case 'terminal-0v':
        return createTerminal0VSymbol(w, h, props, dyn);
      case 'button-no':
        return createButtonNOSymbol(w, h, props, dyn);
      case 'button-no-detent':
        return createButtonNODetentSymbol(w, h, props, dyn);
      case 'button-nc':
        return createButtonNCSymbol(w, h, props, dyn);
      case 'button-nc-detent':
        return createButtonNCDetentSymbol(w, h, props, dyn);
      case 'button-changeover':
        return createButtonChangeoverSymbol(w, h, props, dyn);
      case 'button-changeover-detent':
        return createButtonChangeoverDetentSymbol(w, h, props, dyn);
      case 'relay':
        return createRelaySymbol(w, h, props, dyn);
      case 'relay-contact-no':
        return createRelayContactNOSymbol(w, h, props, dyn);
      case 'relay-contact-nc':
        return createRelayContactNCSymbol(w, h, props, dyn);
      case 'timer-on-delay':
        return createTimerOnDelaySymbol(w, h, props, dyn);
      case 'timer-off-delay':
        return createTimerOffDelaySymbol(w, h, props, dyn);
      case 'counter':
        return createCounterSymbol(w, h, props, dyn);
      case 'solenoid-coil':
        return createSolenoidCoilSymbol(w, h, props, dyn);
      case 'limit-switch':
        return createLimitSwitchSymbol(w, h, props, dyn);
      case 'indicator-lamp':
        return createIndicatorLampSymbol(w, h, props, dyn);
      default:
        return `<rect x="-20" y="-20" width="40" height="40" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>`;
    }
  }

  // ============================================================
  // 4. DOM REFERENCES & UTILITY FUNCTIONS
  // ============================================================

  const DOM = {};

  function initDOMReferences() {
    DOM.sidebar = document.getElementById('sidebar');
    DOM.sidebarToggle = document.getElementById('sidebar-toggle');
    DOM.sidebarClose = document.getElementById('sidebar-close');
    DOM.libraryPanel = document.getElementById('library-panel');
    DOM.libraryClose = document.getElementById('library-close');
    DOM.librarySearch = document.getElementById('library-search');
    DOM.libraryFilter = document.getElementById('library-filter');
    DOM.libraryComponents = document.getElementById('library-components');
    DOM.propertyPanel = document.getElementById('property-panel');
    DOM.propertyClose = document.getElementById('property-close');
    DOM.propertyContent = document.getElementById('property-content');

    // Material elements
    DOM.materialNav = document.getElementById('material-nav');
    DOM.materialInfo = document.getElementById('material-info');
    DOM.materialBadge = document.getElementById('material-badge');
    DOM.headerMaterialBadge = document.getElementById('header-material-badge');
    DOM.materialTitle = document.getElementById('material-title');
    DOM.materialDescription = document.getElementById('material-description');
    DOM.objectivesList = document.getElementById('objectives-list');
    DOM.componentListItems = document.getElementById('component-list-items');
    DOM.materialExtendedTheory = document.getElementById('material-extended-theory');
    DOM.materialStepsContainer = document.getElementById('material-steps-container');
    DOM.quizContainer = document.getElementById('quiz-container');
    DOM.analysisContainer = document.getElementById('analysis-container');
    DOM.btnLoadPreset = document.getElementById('btn-load-preset');
    DOM.btnToWorkspace = document.getElementById('btn-to-workspace');
    DOM.closeMaterialInfo = document.getElementById('close-material-info');

    // Workspace elements
    DOM.workspaceArea = document.getElementById('workspace-area');
    DOM.btnShowMaterial = document.getElementById('btn-show-material');
    DOM.workspaceContainer = document.getElementById('workspace-container');
    DOM.workspaceSvg = document.getElementById('workspace-svg');
    DOM.workspaceBg = document.getElementById('workspace-bg');
    DOM.workspaceGrid = document.getElementById('workspace-grid');
    DOM.componentsLayer = document.getElementById('components-layer');
    DOM.connectionsLayer = document.getElementById('connections-layer');
    DOM.junctionsLayer = document.getElementById('junctions-layer');
    DOM.tempConnectionLayer = document.getElementById('temp-connection-layer');
    DOM.emptyWorkspaceMsg = document.getElementById('empty-workspace-msg');
    DOM.connectionBanner = document.getElementById('connection-banner');
    DOM.connectionBannerText = document.getElementById('connection-banner-text');
    DOM.btnCancelConnection = document.getElementById('btn-cancel-connection');

    // Simulation Bar elements
    DOM.simulationControlBar = document.getElementById('simulation-control-bar');
    DOM.simLiveStatusText = document.getElementById('sim-live-status-text');
    DOM.btnSimPlayPause = document.getElementById('btn-sim-play-pause');
    DOM.simPlayIcon = document.getElementById('sim-play-icon');
    DOM.simPlayText = document.getElementById('sim-play-text');
    DOM.btnSimReleaseAll = document.getElementById('btn-sim-release-all');
    DOM.simInteractiveButtons = document.getElementById('sim-interactive-buttons');

    // Toolbar buttons
    DOM.btnUndo = document.getElementById('btn-undo');
    DOM.btnRedo = document.getElementById('btn-redo');
    DOM.componentCount = document.getElementById('component-count');
    DOM.connectionCount = document.getElementById('connection-count');
    DOM.zoomLevel = document.getElementById('zoom-level');
    DOM.zoomIn = document.getElementById('zoom-in');
    DOM.zoomOut = document.getElementById('zoom-out');
    DOM.zoomFit = document.getElementById('zoom-fit');
    DOM.rotateSelected = document.getElementById('rotate-selected');
    DOM.deleteSelected = document.getElementById('delete-selected');
    DOM.deleteAll = document.getElementById('delete-all');

    // Header buttons
    DOM.btnDiagnostics = document.getElementById('btn-diagnostics');
    DOM.btnSave = document.getElementById('btn-save');
    DOM.btnLoad = document.getElementById('btn-load');
    DOM.fileInputProject = document.getElementById('file-input-project');
    DOM.btnSaveBrowser = document.getElementById('btn-save-browser');
    DOM.btnLoadBrowser = document.getElementById('btn-load-browser');
    DOM.btnHome = document.getElementById('btn-home');
    DOM.btnHelp = document.getElementById('btn-help');
    DOM.btnReset = document.getElementById('btn-reset');
    DOM.btnMode = document.getElementById('btn-mode');
    DOM.modeIcon = document.getElementById('mode-icon');
    DOM.modeLabel = document.getElementById('mode-label');

    // Modal
    DOM.modalOverlay = document.getElementById('modal-overlay');
    DOM.modalTitle = document.getElementById('modal-title');
    DOM.modalBody = document.getElementById('modal-body');
    DOM.modalClose = document.getElementById('modal-close');
    DOM.toastContainer = document.getElementById('toast-container');
  }

  function generateId(prefix = 'comp') {
    AppState.componentCounter++;
    return `${prefix}_${AppState.componentCounter}_${Math.random().toString(36).substr(2, 5)}`;
  }

  function snapToGrid(val, step = 10) {
    return Math.round(val / step) * step;
  }

  function getComponentDef(defId) {
    return componentLibrary.find(c => c.id === defId) || null;
  }

  function getComponentById(compId) {
    return workspaceComponents.find(c => c.id === compId) || null;
  }

  function getPortPosition(port, width, height) {
    const halfW = width / 2;
    const halfH = height / 2;
    let x = 0, y = 0;
    const offset = port.offset !== undefined ? port.offset : 0.5;

    switch (port.side) {
      case 'top':
        x = -halfW + width * offset;
        y = -halfH;
        break;
      case 'bottom':
        x = -halfW + width * offset;
        y = halfH;
        break;
      case 'left':
        x = -halfW;
        y = -halfH + height * offset;
        break;
      case 'right':
        x = halfW;
        y = -halfH + height * offset;
        break;
    }
    return { x, y };
  }

  function getRotatedSide(side, rot) {
    if (!side) return side;
    const sides = ['top', 'right', 'bottom', 'left'];
    const idx = sides.indexOf(side);
    if (idx === -1) return side;
    const steps = Math.round(((((rot || 0) % 360) + 360) % 360) / 90);
    return sides[(idx + steps) % 4];
  }

  function screenToSVGCoordinates(screenX, screenY) {
    if (!DOM.workspaceSvg) return { x: 0, y: 0 };
    const rect = DOM.workspaceSvg.getBoundingClientRect();
    const svgX = screenX - rect.left;
    const svgY = screenY - rect.top;
    return {
      x: (svgX - AppState.panX) / AppState.zoom,
      y: (svgY - AppState.panY) / AppState.zoom
    };
  }

  function showToast(message, type = 'info', duration = 3000) {
    if (!DOM.toastContainer) return;
    // Batasi jumlah toast agar tidak menumpuk menutupi layar
    const maxToasts = window.innerWidth <= 768 ? 2 : 3;
    while (DOM.toastContainer.children.length >= maxToasts) {
      DOM.toastContainer.removeChild(DOM.toastContainer.firstChild);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-dot toast-dot-${type}"></span>
      <span class="toast-message">${message}</span>
    `;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  function updateEmptyMessage() {
    if (!DOM.emptyWorkspaceMsg) return;
    if (workspaceComponents.length === 0) {
      DOM.emptyWorkspaceMsg.style.display = 'flex';
    } else {
      DOM.emptyWorkspaceMsg.style.display = 'none';
    }
  }

  function updateComponentCount() {
    if (DOM.componentCount) {
      DOM.componentCount.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
        Komponen: <strong>${workspaceComponents.length}</strong>
      `;
    }
    if (DOM.deleteSelected) {
      DOM.deleteSelected.disabled = !AppState.selectedComponentId && !AppState.selectedConnectionId && !AppState.selectedJunctionId;
    }
  }

  function updateConnectionCount() {
    if (DOM.connectionCount) {
      DOM.connectionCount.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        Koneksi: <strong>${connections.length}</strong>
      `;
    }
  }

  // ============================================================
  // 5. WORKSPACE MANAGEMENT (PAN & ZOOM)
  // ============================================================

  function updateViewBox() {
    if (!DOM.workspaceSvg) return;
    const rect = DOM.workspaceContainer ? DOM.workspaceContainer.getBoundingClientRect() : { width: 1000, height: 700 };
    const w = rect.width / AppState.zoom;
    const h = rect.height / AppState.zoom;
    const x = -AppState.panX / AppState.zoom;
    const y = -AppState.panY / AppState.zoom;

    DOM.workspaceSvg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`);

    if (DOM.zoomLevel) {
      DOM.zoomLevel.textContent = `Zoom: ${Math.round(AppState.zoom * 100)}%`;
    }
  }

  function zoomIn() {
    AppState.zoom = Math.min(2.5, AppState.zoom + 0.15);
    updateViewBox();
  }

  function zoomOut() {
    AppState.zoom = Math.max(0.4, AppState.zoom - 0.15);
    updateViewBox();
  }

  function zoomToFit() {
    if (workspaceComponents.length === 0) {
      AppState.zoom = 1.0;
      AppState.panX = 0;
      AppState.panY = 0;
      updateViewBox();
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    workspaceComponents.forEach(c => {
      minX = Math.min(minX, c.x - c.width / 2);
      minY = Math.min(minY, c.y - c.height / 2);
      maxX = Math.max(maxX, c.x + c.width / 2);
      maxY = Math.max(maxY, c.y + c.height / 2);
    });

    const pad = 80;
    const rect = DOM.workspaceContainer ? DOM.workspaceContainer.getBoundingClientRect() : { width: 1000, height: 700 };
    const w = (maxX - minX) + pad * 2;
    const h = (maxY - minY) + pad * 2;

    const zX = rect.width / w;
    const zY = rect.height / h;
    AppState.zoom = Math.max(0.4, Math.min(1.5, Math.min(zX, zY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;
    AppState.panX = (rect.width / 2) - midX * AppState.zoom;
    AppState.panY = (rect.height / 2) - midY * AppState.zoom;

    updateViewBox();
  }

  function clearAllComponents(silent = false) {
    if (workspaceComponents.length === 0 && connections.length === 0) return;

    if (!silent && !confirm('Apakah Anda yakin ingin menghapus SEMUA komponen dan koneksi pada lembar kerja?')) {
      return;
    }

    if (DOM.componentsLayer) DOM.componentsLayer.innerHTML = '';
    if (DOM.connectionsLayer) DOM.connectionsLayer.innerHTML = '';
    if (DOM.junctionsLayer) DOM.junctionsLayer.innerHTML = '';
    if (DOM.tempConnectionLayer) DOM.tempConnectionLayer.innerHTML = '';

    workspaceComponents.length = 0;
    connections.length = 0;
    junctions.length = 0;

    deselectComponent();
    deselectConnection();
    deselectJunction();

    updateComponentCount();
    updateConnectionCount();
    updateEmptyMessage();
    if (typeof updateNeutralWires === 'function') updateNeutralWires();

    if (!isBatchAction && !isRestoringState) {
      commitState();
    }

    if (!silent) {
      showToast('Area kerja berhasil dibersihkan', 'info', 1500);
    }
  }

  // ============================================================
  // 5.5 HISTORY & UNDO / REDO ENGINE (SNAPSHOT-BASED)
  // ============================================================

  const MAX_HISTORY = 100;
  const history = [];
  let historyIndex = -1;
  let isRestoringState = false;
  let isBatchAction = false;
  let dragStartCompX = 0;
  let dragStartCompY = 0;

  function createSnapshot() {
    return JSON.stringify({
      components: workspaceComponents,
      connections: connections,
      junctions: junctions
    });
  }

  function commitState() {
    if (isRestoringState || isBatchAction) return;
    if (AppState.mode === 'simulate') return;

    const snap = createSnapshot();

    // Jangan rekam jika snapshot identik dengan state aktif saat ini
    if (historyIndex >= 0 && historyIndex < history.length && history[historyIndex] === snap) {
      return;
    }

    // Jika user melakukan aksi setelah undo, buang sisa riwayat redo
    if (historyIndex < history.length - 1) {
      history.splice(historyIndex + 1);
    }

    history.push(snap);

    // Batasi riwayat maksimal 100 langkah aksi (1 state dasar + 100 aksi = 101 snapshot)
    if (history.length > MAX_HISTORY + 1) {
      history.shift();
    }

    historyIndex = history.length - 1;
    updateUndoRedoButtons();
  }

  function undo() {
    if (AppState.mode === 'simulate') {
      showToast('Tidak bisa undo saat simulasi', 'warning', 2000);
      return false;
    }
    if (historyIndex <= 0) {
      return false;
    }

    historyIndex--;
    const success = restoreSnapshot(history[historyIndex]);
    if (success) {
      updateUndoRedoButtons();
      showToast('Aksi dibatalkan (Undo)', 'info', 1200);
    }
    return success;
  }

  function redo() {
    if (AppState.mode === 'simulate') {
      showToast('Tidak bisa redo saat simulasi', 'warning', 2000);
      return false;
    }
    if (historyIndex >= history.length - 1) {
      return false;
    }

    historyIndex++;
    const success = restoreSnapshot(history[historyIndex]);
    if (success) {
      updateUndoRedoButtons();
      showToast('Aksi diulang (Redo)', 'info', 1200);
    }
    return success;
  }

  function restoreSnapshot(snapshotJSON) {
    try {
      const data = typeof snapshotJSON === 'string' ? JSON.parse(snapshotJSON) : snapshotJSON;
      if (!data || !Array.isArray(data.components) || !Array.isArray(data.connections)) {
        throw new Error('Format data snapshot tidak valid');
      }

      isRestoringState = true;

      // Batalkan seleksi aktif jika komponen/koneksi/junction tidak ada lagi
      deselectComponent();
      deselectConnection();
      deselectJunction();

      // Bersihkan layer DOM SVG
      if (DOM.componentsLayer) DOM.componentsLayer.innerHTML = '';
      if (DOM.connectionsLayer) DOM.connectionsLayer.innerHTML = '';
      if (DOM.junctionsLayer) DOM.junctionsLayer.innerHTML = '';
      if (DOM.tempConnectionLayer) DOM.tempConnectionLayer.innerHTML = '';

      workspaceComponents.length = 0;
      connections.length = 0;
      junctions.length = 0;

      // Deep clone data snapshot untuk mencegah referensi termutasi
      const comps = JSON.parse(JSON.stringify(data.components));
      const conns = JSON.parse(JSON.stringify(data.connections));
      const juncs = JSON.parse(JSON.stringify(data.junctions || []));

      // Restore Komponen
      comps.forEach(c => {
        if (typeof c.rotation !== 'number') c.rotation = 0;
        else c.rotation = (((c.rotation % 360) + 360) % 360);
        workspaceComponents.push(c);
        renderComponent(c);
      });

      // Restore Junctions
      juncs.forEach(j => {
        junctions.push(j);
        renderJunction(j);
      });

      // Restore Koneksi (pipa & kabel)
      conns.forEach(conn => {
        connections.push(conn);
        renderConnection(conn);
      });

      updateComponentCount();
      updateConnectionCount();
      updateEmptyMessage();
      if (typeof updateNeutralWires === 'function') updateNeutralWires();

      isRestoringState = false;
      return true;
    } catch (err) {
      isRestoringState = false;
      console.error('Gagal memulihkan snapshot:', err);
      showToast('Gagal memulihkan state rangkaian: ' + err.message, 'error', 3000);
      return false;
    }
  }

  function updateUndoRedoButtons() {
    if (DOM.btnUndo) {
      DOM.btnUndo.disabled = (AppState.mode === 'simulate') || (historyIndex <= 0);
    }
    if (DOM.btnRedo) {
      DOM.btnRedo.disabled = (AppState.mode === 'simulate') || (historyIndex >= history.length - 1);
    }
  }

  function initHistory() {
    history.length = 0;
    history.push(createSnapshot());
    historyIndex = 0;
    updateUndoRedoButtons();
  }

  // ============================================================
  // 6. COMPONENT MANAGEMENT
  // ============================================================

  function addComponent(defId, x, y, customProps = null) {
    const def = getComponentDef(defId);
    if (!def) {
      console.error(`Definisi komponen tidak ditemukan: ${defId}`);
      return null;
    }

    const id = generateId(def.id);
    const existingSame = workspaceComponents.filter(c => c.defId === def.id).length;
    const label = `${def.defaultLabel}${existingSame > 0 ? (existingSame + 1) : ''}`;

    // Port cloning with support for dynamic pilot ports if def has them
    const ports = JSON.parse(JSON.stringify(def.ports));

    const componentData = {
      id: id,
      defId: def.id,
      name: def.name,
      category: def.category,
      categoryName: def.categoryName,
      type: def.type,
      x: snapToGrid(x, 10),
      y: snapToGrid(y, 10),
      width: def.width,
      height: def.height,
      rotation: (customProps && typeof customProps.rotation === 'number') ? ((((customProps.rotation % 360) + 360) % 360)) : 0,
      label: (customProps && customProps.label) ? customProps.label : label,
      ports: ports,
      properties: Object.assign({}, def.defaultProperties || {}, customProps || {})
    };

    if (def.id === 'relay' || def.id === 'timer-on-delay' || def.id === 'timer-off-delay' || def.id === 'counter') {
      if (!customProps || (!customProps.relayRef && !customProps.relayId)) {
        componentData.properties.relayRef = componentData.label;
        componentData.properties.relayId = componentData.label;
      }
    }

    workspaceComponents.push(componentData);
    renderComponent(componentData);
    selectComponent(componentData.id);

    updateComponentCount();
    updateEmptyMessage();

    if (!isBatchAction && !isRestoringState) {
      commitState();
    }

    return componentData;
  }

  function removeComponent(componentId) {
    const index = workspaceComponents.findIndex(c => c.id === componentId);
    if (index === -1) return;

    const wasBatch = isBatchAction;
    isBatchAction = true;

    const comp = workspaceComponents[index];
    const elem = document.getElementById(`comp-${componentId}`);
    if (elem && elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }

    if (AppState.selectedComponentId === componentId) {
      deselectComponent();
    }

    removeConnectionsForComponent(componentId);
    workspaceComponents.splice(index, 1);

    updateComponentCount();
    updateEmptyMessage();
    if (typeof updateNeutralWires === 'function') updateNeutralWires();

    isBatchAction = wasBatch;
    if (!isBatchAction && !isRestoringState) {
      commitState();
    }

    showToast(`Komponen "${comp.name}" dihapus`, 'info', 1500);
  }

  function selectComponent(componentId) {
    deselectConnection();
    deselectJunction();

    if (AppState.selectedComponentId === componentId) return;
    if (AppState.selectedComponentId) {
      const prev = document.getElementById(`comp-${AppState.selectedComponentId}`);
      if (prev) prev.classList.remove('selected');
    }

    AppState.selectedComponentId = componentId;
    const curr = document.getElementById(`comp-${componentId}`);
    if (curr) curr.classList.add('selected');

    if (DOM.deleteSelected) DOM.deleteSelected.disabled = false;
    if (DOM.rotateSelected) DOM.rotateSelected.disabled = AppState.mode === 'simulate';
    showPropertyPanel(componentId);
  }

  function deselectComponent() {
    if (!AppState.selectedComponentId) return;
    const elem = document.getElementById(`comp-${AppState.selectedComponentId}`);
    if (elem) elem.classList.remove('selected');
    AppState.selectedComponentId = null;
    if (DOM.deleteSelected) {
      DOM.deleteSelected.disabled = !AppState.selectedConnectionId && !AppState.selectedJunctionId;
    }
    if (DOM.rotateSelected) {
      DOM.rotateSelected.disabled = true;
    }
    hidePropertyPanel();
  }

  function renderComponent(comp, dynState = {}) {
    if (!DOM.componentsLayer) return;
    let group = document.getElementById(`comp-${comp.id}`);

    const isInteractive = (
      comp.defId.startsWith('button-') ||
      comp.defId === 'valve-3-2' ||
      comp.defId === 'valve-3-2-push' ||
      comp.defId === 'pneumatic-push-button' ||
      (comp.properties && comp.properties.actuationLeft === 'push-button')
    );

    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.id = `comp-${comp.id}`;
      group.className.baseVal = `component-group ${isInteractive ? 'interactive-button' : ''}`;
      DOM.componentsLayer.appendChild(group);

      // Attach interaction events (supporting Mouse, Touch, & Stylus via Pointer Events)
      const onCompPointerDown = (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        if (AppState.mode === 'simulate') {
          // Push button actuation in simulation mode
          if (isInteractive) {
            e.stopPropagation();
            SimEngine.pressButton(comp.id);
          }
          return;
        }
        e.stopPropagation();
        selectComponent(comp.id);
        startComponentDrag(comp.id, e.clientX, e.clientY);
      };

      const onCompPointerUp = () => {
        if (AppState.mode === 'simulate' && isInteractive) {
          SimEngine.releaseButton(comp.id);
        }
      };

      if (window.PointerEvent) {
        group.addEventListener('pointerdown', onCompPointerDown);
        group.addEventListener('pointerup', onCompPointerUp);
        group.addEventListener('pointercancel', onCompPointerUp);
      } else {
        group.addEventListener('mousedown', onCompPointerDown);
        group.addEventListener('mouseup', onCompPointerUp);
        group.addEventListener('mouseleave', onCompPointerUp);
      }
    }

    const rot = (((comp.rotation || 0) % 360) + 360) % 360;
    group.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${rot})`);

    // Render contents: Selection Border, Symbol, Ports, and Label
    const def = getComponentDef(comp.defId);
    const compW = comp.width || (def ? def.width : 60);
    const compH = comp.height || (def ? def.height : 60);
    if (!comp.width) comp.width = compW;
    if (!comp.height) comp.height = compH;
    const halfW = compW / 2;
    const halfH = compH / 2;

    const symbolSVG = renderComponentSymbol(comp, dynState);

    let portsSVG = '';
    comp.ports.forEach(port => {
      const pos = getPortPosition(port, compW, compH);
      const isConnected = isPortConnected(comp.id, port.portNumber);
      const isPneu = port.type === 'pneumatic';
      const isButton = comp.defId.startsWith('button-');
      const isTerminal = comp.defId === 'dc-source' || comp.defId === 'terminal-0v';
      const isCoil = comp.defId === 'relay' || comp.defId === 'solenoid-coil' || comp.defId === 'timer-on-delay' || comp.defId === 'timer-off-delay' || comp.defId === 'counter';
      const isDarkPort = isPneu || isTerminal || isCoil || isButton;
      const portColor = isDarkPort ? '#1e293b' : '#ef4444';
      const portRadius = isDarkPort ? 3.5 : 4.5;
      const portFill = (isTerminal || isCoil || isButton) ? '#ffffff' : (isPneu ? '#ffffff' : (isConnected ? portColor : '#ffffff'));

      portsSVG += `
        <g class="port-group" data-comp-id="${comp.id}" data-port-num="${port.portNumber}" data-port-type="${port.type}" data-port-name="${port.name}">
          <circle cx="${pos.x}" cy="${pos.y}" r="${portRadius}"
            class="component-port port-${port.type} ${(isTerminal || isCoil || isButton) ? 'port-terminal port-coil port-button' : ''} ${isConnected ? 'connected' : ''}"
            id="port-${comp.id}-${port.portNumber}"
            fill="${portFill}"
            stroke="${portColor}"
            stroke-width="1.5"
          />
        </g>
      `;
    });

    group.innerHTML = `
      <rect class="selection-border" x="${-halfW - 6}" y="${-halfH - 6}" width="${comp.width + 12}" height="${comp.height + 12}" rx="4" style="display:${AppState.selectedComponentId === comp.id ? 'block' : 'none'};"/>
      <g class="symbol-content">${symbolSVG}</g>
      <g class="ports-layer">${portsSVG}</g>
      <text class="component-label" x="0" y="${halfH + 15}">${comp.label}</text>
    `;

    // Attach click listener for ports (Touch, Stylus, & Mouse)
    const portElems = group.querySelectorAll('.port-group');
    portElems.forEach(pe => {
      const onPortDown = (e) => {
        if (AppState.mode === 'simulate') return; // Ports locked in simulation
        e.stopPropagation();
        const pNum = Number(pe.getAttribute('data-port-num'));
        const pType = pe.getAttribute('data-port-type');
        handlePortClick(comp.id, pNum, pType, e);
      };

      if (window.PointerEvent) {
        pe.addEventListener('pointerdown', onPortDown);
      } else {
        pe.addEventListener('mousedown', onPortDown);
      }
    });
  }

  function updateComponentPosition(compId, newX, newY) {
    const comp = getComponentById(compId);
    if (!comp) return;

    comp.x = snapToGrid(newX, 10);
    comp.y = snapToGrid(newY, 10);

    const group = document.getElementById(`comp-${compId}`);
    if (group) {
      const rot = (((comp.rotation || 0) % 360) + 360) % 360;
    group.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${rot})`);
    }

    // Update attached connections
    updateConnectionsForComponent(compId);
  }

  function rotateComponent(compId, degrees = 90) {
    if (AppState.mode === 'simulate') {
      showToast('Komponen tidak dapat diputar saat Mode Simulasi aktif', 'warning', 2000);
      return null;
    }

    const comp = getComponentById(compId);
    if (!comp) return null;

    comp.rotation = (((comp.rotation || 0) + degrees) % 360 + 360) % 360;

    const group = document.getElementById(`comp-${compId}`);
    if (group) {
      group.setAttribute('transform', `translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`);
    }

    // Update all connections attached to this component
    updateConnectionsForComponent(compId);

    // Update rotation badge in property panel if open
    const rotBadge = document.getElementById('prop-rotation-display');
    if (rotBadge) {
      rotBadge.textContent = `${comp.rotation}°`;
    }

    if (!isBatchAction && !isRestoringState) {
      commitState();
    }

    return comp.rotation;
  }


  // ============================================================
  // 7. DRAG & DROP AND PANNING
  // ============================================================

  function startComponentDrag(compId, clientX, clientY) {
    const comp = getComponentById(compId);
    if (!comp) return;

    AppState.isDragging = true;
    AppState.draggedComponentId = compId;
    dragStartCompX = comp.x;
    dragStartCompY = comp.y;
    const svgPt = screenToSVGCoordinates(clientX, clientY);
    AppState.dragOffsetX = svgPt.x - comp.x;
    AppState.dragOffsetY = svgPt.y - comp.y;

    const group = document.getElementById(`comp-${compId}`);
    if (group) group.classList.add('dragging');
  }

  function handleWorkspaceMouseDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    if (e.target.closest && e.target.closest('.component-group')) return;
    if (e.target.closest && e.target.closest('.port-group')) return;
    if (e.target.closest && e.target.closest('.connection-hit-area')) return;

    // Deselect
    deselectComponent();
    deselectConnection();
    deselectJunction();

    if (AppState.connectionDrawing.active) {
      // Cancel drawing if clicked on empty canvas
      cancelConnectionDrawing();
      return;
    }

    // Start panning
    AppState.isPanning = true;
    AppState.panStartX = e.clientX - AppState.panX;
    AppState.panStartY = e.clientY - AppState.panY;
    if (DOM.workspaceSvg) DOM.workspaceSvg.style.cursor = 'grabbing';
  }

  function handleWorkspaceMouseMove(e) {
    // 1. Drag component
    if (AppState.isDragging && AppState.draggedComponentId) {
      const svgPt = screenToSVGCoordinates(e.clientX, e.clientY);
      const newX = svgPt.x - AppState.dragOffsetX;
      const newY = svgPt.y - AppState.dragOffsetY;
      updateComponentPosition(AppState.draggedComponentId, newX, newY);
      return;
    }

    // 2. Pan workspace
    if (AppState.isPanning) {
      AppState.panX = e.clientX - AppState.panStartX;
      AppState.panY = e.clientY - AppState.panStartY;
      updateViewBox();
      return;
    }

    // 3. Draft live connection line
    if (AppState.connectionDrawing.active) {
      const svgPt = screenToSVGCoordinates(e.clientX, e.clientY);
      updateTempConnection(svgPt);
    }
  }

  function handleWorkspaceMouseUp(e) {
    if (AppState.isDragging && AppState.draggedComponentId) {
      const comp = getComponentById(AppState.draggedComponentId);
      const moved = comp && (comp.x !== dragStartCompX || comp.y !== dragStartCompY);
      const group = document.getElementById(`comp-${AppState.draggedComponentId}`);
      if (group) group.classList.remove('dragging');
      AppState.isDragging = false;
      AppState.draggedComponentId = null;
      if (moved && !isBatchAction && !isRestoringState) {
        commitState();
      }
    }

    if (AppState.isPanning) {
      AppState.isPanning = false;
      if (DOM.workspaceSvg) DOM.workspaceSvg.style.cursor = 'default';
    }
  }

  // ============================================================
  // 8. CONNECTION & GRAPH ENGINE
  // ============================================================

  function getPortData(compId, portNumber) {
    const comp = getComponentById(compId);
    if (!comp) return null;
    const port = comp.ports.find(p => p.portNumber === Number(portNumber));
    if (!port) return null;
    const rel = getPortPosition(port, comp.width, comp.height);
    const rot = (((comp.rotation || 0) % 360) + 360) % 360;

    let rx = rel.x;
    let ry = rel.y;
    if (rot === 90) {
      rx = -rel.y;
      ry = rel.x;
    } else if (rot === 180) {
      rx = -rel.x;
      ry = -rel.y;
    } else if (rot === 270) {
      rx = rel.y;
      ry = -rel.x;
    }

    return {
      id: `${comp.id}_p${port.portNumber}`,
      componentId: comp.id,
      componentLabel: comp.label,
      componentName: comp.name,
      portNumber: port.portNumber,
      name: port.name,
      portType: port.type, // 'pneumatic' atau 'electrical'
      side: getRotatedSide(port.side, rot),
      offset: port.offset,
      x: comp.x + rx,
      y: comp.y + ry
    };
  }

  function isPortConnected(compId, portNum) {
    return connections.some(c =>
      (c.sourceCompId === compId && c.sourcePortNum === portNum) ||
      (c.targetCompId === compId && c.targetPortNum === portNum)
    );
  }

  // Industrial Orthogonal 90° Routing (Smart Collision Avoidance)
  function calculateOrthogonalPath(start, end) {
    if (!start || !end) return [];
    const stub = 16;
    const sX = start.x, sY = start.y;
    const eX = end.x, eY = end.y;

    let sStubX = sX, sStubY = sY;
    if (start.side === 'top') sStubY = sY - stub;
    else if (start.side === 'bottom') sStubY = sY + stub;
    else if (start.side === 'left') sStubX = sX - stub;
    else if (start.side === 'right') sStubX = sX + stub;

    let eStubX = eX, eStubY = eY;
    if (end.side === 'top') eStubY = eY - stub;
    else if (end.side === 'bottom') eStubY = eY + stub;
    else if (end.side === 'left') eStubX = eX - stub;
    else if (end.side === 'right') eStubX = eX + stub;

    const points = [{ x: sX, y: sY }];
    if (start.side) points.push({ x: sStubX, y: sStubY });

    const sVert = start.side === 'top' || start.side === 'bottom';
    const eVert = end.side === 'top' || end.side === 'bottom';

    if (start.side && end.side) {
      if (sVert && eVert) {
        if (start.side === end.side) {
          // Kedua port menghadap arah vertikal yang sama
          const bendY = start.side === 'top' ? Math.min(sStubY, eStubY) - 10 : Math.max(sStubY, eStubY) + 10;
          points.push({ x: sStubX, y: bendY });
          points.push({ x: eStubX, y: bendY });
        } else {
          // Satu port top, satu port bottom
          const isProperGap = (start.side === 'top' && sStubY > eStubY) || (start.side === 'bottom' && sStubY < eStubY);
          if (isProperGap) {
            const midY = (sStubY + eStubY) / 2;
            points.push({ x: sStubX, y: midY });
            points.push({ x: eStubX, y: midY });
          } else {
            // Stub tumpang tindih: memutar melalui kolom tengah X
            const midX = (sStubX + eStubX) / 2;
            points.push({ x: midX, y: sStubY });
            points.push({ x: midX, y: eStubY });
          }
        }
      } else if (!sVert && !eVert) {
        if (start.side === end.side) {
          // Kedua port menghadap arah horizontal yang sama
          const bendX = start.side === 'left' ? Math.min(sStubX, eStubX) - 10 : Math.max(sStubX, eStubX) + 10;
          points.push({ x: bendX, y: sStubY });
          points.push({ x: bendX, y: eStubY });
        } else {
          const isProperGap = (start.side === 'right' && sStubX < eStubX) || (start.side === 'left' && sStubX > eStubX);
          if (isProperGap) {
            const midX = (sStubX + eStubX) / 2;
            points.push({ x: midX, y: sStubY });
            points.push({ x: midX, y: eStubY });
          } else {
            const midY = (sStubY + eStubY) / 2;
            points.push({ x: sStubX, y: midY });
            points.push({ x: eStubX, y: midY });
          }
        }
      } else {
        // Satu vertikal, satu horizontal
        if (sVert) {
          const reversingThroughStart = (start.side === 'top' && eStubY > sStubY) || (start.side === 'bottom' && eStubY < sStubY);
          if (reversingThroughStart) {
            points.push({ x: eStubX, y: sStubY });
          } else {
            const enteringWrongSide = (end.side === 'left' && sStubX > eStubX) || (end.side === 'right' && sStubX < eStubX);
            if (enteringWrongSide) {
              const midY = (sStubY + eStubY) / 2;
              points.push({ x: sStubX, y: midY });
              points.push({ x: eStubX, y: midY });
            } else {
              points.push({ x: sStubX, y: eStubY });
            }
          }
        } else {
          // start horizontal, end vertikal
          const enteringWrongSide = (end.side === 'top' && sStubY > eStubY) || (end.side === 'bottom' && sStubY < eStubY);
          if (enteringWrongSide) {
            const midX = (sStubX + eStubX) / 2;
            points.push({ x: midX, y: sStubY });
            points.push({ x: midX, y: eStubY });
          } else {
            points.push({ x: eStubX, y: sStubY });
          }
        }
      }
    } else {
      // Sambungan ke junction tanpa side
      if (start.side) {
        if (sVert) {
          const enteringWrongSide = (start.side === 'top' && eY > sStubY) || (start.side === 'bottom' && eY < sStubY);
          if (enteringWrongSide) {
            const midX = (sStubX + eX) / 2;
            points.push({ x: midX, y: sStubY });
            points.push({ x: midX, y: eY });
          } else {
            points.push({ x: sStubX, y: eY });
          }
        } else {
          const enteringWrongSide = (start.side === 'left' && eX > sStubX) || (start.side === 'right' && eX < sStubX);
          if (enteringWrongSide) {
            const midY = (sStubY + eY) / 2;
            points.push({ x: sStubX, y: midY });
            points.push({ x: eX, y: midY });
          } else {
            points.push({ x: eX, y: sStubY });
          }
        }
      } else if (end.side) {
        if (eVert) {
          points.push({ x: sX, y: eStubY });
        } else {
          points.push({ x: eStubX, y: sY });
        }
      } else {
        points.push({ x: (sX + eX) / 2, y: sY });
        points.push({ x: (sX + eX) / 2, y: eY });
      }
    }

    if (end.side) points.push({ x: eStubX, y: eStubY });
    points.push({ x: eX, y: eY });
    return points;
  }

  function pointsToSVGPath(points) {
    if (!points || points.length === 0) return '';
    return points.reduce((acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '').trim();
  }

  // Connection Drawing Handlers
  function handlePortClick(compId, portNum, portType, e) {
    const drawing = AppState.connectionDrawing;

    if (!drawing.active) {
      // Start Drawing Connection
      const portData = getPortData(compId, portNum);
      if (!portData) return;

      drawing.active = true;
      drawing.sourceType = 'port';
      drawing.sourceCompId = compId;
      drawing.sourcePortNum = portNum;
      drawing.sourcePortType = portType;
      drawing.startPoint = portData;

      if (DOM.connectionBanner) {
        DOM.connectionBanner.style.display = 'flex';
        if (DOM.connectionBannerText) {
          DOM.connectionBannerText.textContent = `Menyambungkan Port: [${portData.componentLabel} : ${portData.name}] → Pilih Port Tujuan atau Jalur Percabangan`;
        }
      }

      showToast(`Pilih port tujuan bertipe ${portType === 'pneumatic' ? 'Pneumatik' : 'Elektrikal'}`, 'info', 2000);
    } else {
      // Complete Connection
      if (drawing.sourceCompId === compId && drawing.sourcePortNum === portNum) {
        cancelConnectionDrawing();
        return;
      }

      // Check Type Compatibility
      if (drawing.sourcePortType !== portType) {
        showToast('Kesalahan Standar Teknik: Saluran pneumatik tidak boleh disambung ke terminal elektrikal!', 'error', 3500);
        return;
      }

      // Check Duplicate Connection
      const exists = connections.some(c =>
        (c.sourceCompId === drawing.sourceCompId && c.sourcePortNum === drawing.sourcePortNum &&
         c.targetCompId === compId && c.targetPortNum === portNum) ||
        (c.sourceCompId === compId && c.sourcePortNum === portNum &&
         c.targetCompId === drawing.sourceCompId && c.targetPortNum === drawing.sourcePortNum)
      );

      if (exists) {
        showToast('Sambungan antara kedua port ini sudah ada', 'warning', 2000);
        cancelConnectionDrawing();
        return;
      }

      addConnection(drawing.sourceCompId, drawing.sourcePortNum, compId, portNum, portType);
      cancelConnectionDrawing();
    }
  }

  function updateTempConnection(currentPoint) {
    if (!AppState.connectionDrawing.active || !DOM.tempConnectionLayer) return;
    const startPt = AppState.connectionDrawing.startPoint;
    if (!startPt) return;

    const pathPts = calculateOrthogonalPath(startPt, { x: currentPoint.x, y: currentPoint.y, side: null });
    const dStr = pointsToSVGPath(pathPts);
    const pType = AppState.connectionDrawing.sourcePortType;

    DOM.tempConnectionLayer.innerHTML = `
      <path d="${dStr}" class="connection-temp-line ${pType}"/>
    `;
  }

  function cancelConnectionDrawing() {
    AppState.connectionDrawing.active = false;
    AppState.connectionDrawing.sourceCompId = null;
    AppState.connectionDrawing.sourcePortNum = null;
    AppState.connectionDrawing.startPoint = null;

    if (DOM.tempConnectionLayer) DOM.tempConnectionLayer.innerHTML = '';
    if (DOM.connectionBanner) DOM.connectionBanner.style.display = 'none';
  }

  function addConnection(sourceCompId, sourcePortNum, targetCompId, targetPortNum, type = 'pneumatic', customId = null) {
    const id = customId || generateId('conn');
    const startPt = getPortData(sourceCompId, sourcePortNum);
    const endPt = getPortData(targetCompId, targetPortNum);
    if (!startPt || !endPt) return null;

    const waypoints = calculateOrthogonalPath(startPt, endPt);

    const conn = {
      id: id,
      type: type, // 'pneumatic' atau 'electrical'
      sourceType: 'port',
      sourceCompId: sourceCompId,
      sourcePortNum: Number(sourcePortNum),
      targetType: 'port',
      targetCompId: targetCompId,
      targetPortNum: Number(targetPortNum),
      waypoints: waypoints
    };

    connections.push(conn);
    renderConnection(conn);

    // Update port connected state in DOM
    const sPort = document.getElementById(`port-${sourceCompId}-${sourcePortNum}`);
    if (sPort) sPort.classList.add('connected');
    const tPort = document.getElementById(`port-${targetCompId}-${targetPortNum}`);
    if (tPort) tPort.classList.add('connected');

    updateConnectionCount();
    if (typeof updateNeutralWires === 'function') updateNeutralWires();

    if (!isBatchAction && !isRestoringState) {
      commitState();
    }
    return conn;
  }

  function removeConnection(connId) {
    const idx = connections.findIndex(c => c.id === connId);
    if (idx === -1) return;
    const conn = connections[idx];

    const wasBatch = isBatchAction;
    isBatchAction = true;

    const elem = document.getElementById(`conn-${connId}`);
    if (elem && elem.parentNode) {
      elem.parentNode.removeChild(elem);
    }

    // Also remove any branch connections that connect to junctions on this wire
    const deadJunctions = junctions.filter(j => j.parentConnectionId === connId);
    deadJunctions.forEach(j => removeJunction(j.id));

    connections.splice(idx, 1);

    if (AppState.selectedConnectionId === connId) {
      deselectConnection();
    }

    // Check if ports are still connected to other wires
    if (conn.sourceType === 'port') {
      const sPort = document.getElementById(`port-${conn.sourceCompId}-${conn.sourcePortNum}`);
      if (sPort && !isPortConnected(conn.sourceCompId, conn.sourcePortNum)) {
        sPort.classList.remove('connected');
      }
    }
    if (conn.targetType === 'port') {
      const tPort = document.getElementById(`port-${conn.targetCompId}-${conn.targetPortNum}`);
      if (tPort && !isPortConnected(conn.targetCompId, conn.targetPortNum)) {
        tPort.classList.remove('connected');
      }
    }

    updateConnectionCount();
    if (typeof updateNeutralWires === 'function') updateNeutralWires();

    isBatchAction = wasBatch;
    if (!isBatchAction && !isRestoringState) {
      commitState();
    }

    showToast('Sambungan dihapus', 'info', 1200);
  }

  function removeConnectionsForComponent(compId) {
    const toRemove = connections.filter(c => c.sourceCompId === compId || c.targetCompId === compId);
    toRemove.forEach(c => removeConnection(c.id));
  }

  function selectConnection(connId) {
    deselectComponent();
    deselectJunction();

    if (AppState.selectedConnectionId === connId) return;
    if (AppState.selectedConnectionId) {
      const prev = document.getElementById(`conn-${AppState.selectedConnectionId}`);
      if (prev) prev.classList.remove('selected');
    }

    AppState.selectedConnectionId = connId;
    const curr = document.getElementById(`conn-${connId}`);
    if (curr) curr.classList.add('selected');

    if (DOM.deleteSelected) DOM.deleteSelected.disabled = false;
  }

  function deselectConnection() {
    if (!AppState.selectedConnectionId) return;
    const elem = document.getElementById(`conn-${AppState.selectedConnectionId}`);
    if (elem) elem.classList.remove('selected');
    AppState.selectedConnectionId = null;
    if (DOM.deleteSelected) {
      DOM.deleteSelected.disabled = !AppState.selectedComponentId && !AppState.selectedJunctionId;
    }
  }

  // Branch Junction Support
  function addJunction(parentConnId, x, y, type = 'pneumatic') {
    const id = generateId('junc');
    const junc = {
      id: id,
      parentConnectionId: parentConnId,
      x: snapToGrid(x, 10),
      y: snapToGrid(y, 10),
      type: type
    };
    junctions.push(junc);
    renderJunction(junc);
    if (!isBatchAction && !isRestoringState) {
      commitState();
    }
    return junc;
  }

  function removeJunction(junctionId) {
    const idx = junctions.findIndex(j => j.id === junctionId);
    if (idx === -1) return;

    const wasBatch = isBatchAction;
    isBatchAction = true;

    const elem = document.getElementById(`junc-${junctionId}`);
    if (elem && elem.parentNode) elem.parentNode.removeChild(elem);

    // Remove any connections attached to this junction
    const branchConns = connections.filter(c => c.sourceJunctionId === junctionId || c.targetJunctionId === junctionId);
    branchConns.forEach(c => removeConnection(c.id));

    junctions.splice(idx, 1);
    if (AppState.selectedJunctionId === junctionId) deselectJunction();

    isBatchAction = wasBatch;
    if (!isBatchAction && !isRestoringState) {
      commitState();
    }
  }

  function selectJunction(juncId) {
    deselectComponent();
    deselectConnection();
    AppState.selectedJunctionId = juncId;
    if (DOM.deleteSelected) DOM.deleteSelected.disabled = false;
  }

  function deselectJunction() {
    AppState.selectedJunctionId = null;
    if (DOM.deleteSelected) {
      DOM.deleteSelected.disabled = !AppState.selectedComponentId && !AppState.selectedConnectionId;
    }
  }

  function renderJunction(junc) {
    if (!DOM.junctionsLayer) return;
    let circle = document.getElementById(`junc-${junc.id}`);
    if (!circle) {
      circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.id = `junc-${junc.id}`;
      circle.setAttribute('r', '5');
      circle.setAttribute('class', `connection-junction junction-${junc.type}`);
      circle.setAttribute('fill', junc.type === 'pneumatic' ? '#0284c7' : '#ef4444');
      DOM.junctionsLayer.appendChild(circle);

      circle.addEventListener('mousedown', (e) => {
        if (AppState.mode === 'simulate') return;
        e.stopPropagation();
        selectJunction(junc.id);
      });
    }
    circle.setAttribute('cx', junc.x);
    circle.setAttribute('cy', junc.y);
  }

  function renderConnection(conn) {
    if (!DOM.connectionsLayer) return;
    let group = document.getElementById(`conn-${conn.id}`);
    const dStr = pointsToSVGPath(conn.waypoints);

    if (!group) {
      group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.id = `conn-${conn.id}`;
      group.className.baseVal = `connection-group connection-${conn.type}`;
      DOM.connectionsLayer.appendChild(group);

      // Hit area for easy selection and branching
      group.innerHTML = `
        <path class="connection-hit-area" d="${dStr}"/>
        <path class="connection-line ${conn.type} ${conn.isNeutral ? 'neutral' : ''}" d="${dStr}"/>
      `;

      const onConnDown = (e) => {
        if (AppState.mode === 'simulate') return;
        e.stopPropagation();

        // If in connection drawing mode, allow branching onto this wire!
        if (AppState.connectionDrawing.active) {
          if (AppState.connectionDrawing.sourcePortType === conn.type) {
            const wasBatch = isBatchAction;
            isBatchAction = true;
            try {
              const svgPt = screenToSVGCoordinates(e.clientX, e.clientY);
              const junc = addJunction(conn.id, svgPt.x, svgPt.y, conn.type);
              // Create branch connection
              addBranchConnection(AppState.connectionDrawing.sourceCompId, AppState.connectionDrawing.sourcePortNum, junc.id, conn.type);
            } finally {
              isBatchAction = wasBatch;
            }
            if (!isBatchAction && !isRestoringState) {
              commitState();
            }
            cancelConnectionDrawing();
            showToast('Percabangan berhasil dibuat pada jalur', 'success', 2000);
          } else {
            showToast('Tipe saluran tidak sesuai!', 'error', 2000);
          }
          return;
        }

        selectConnection(conn.id);
      };

      if (window.PointerEvent) {
        group.addEventListener('pointerdown', onConnDown);
      } else {
        group.addEventListener('mousedown', onConnDown);
      }
    } else {
      const hit = group.querySelector('.connection-hit-area');
      const line = group.querySelector('.connection-line');
      if (hit) hit.setAttribute('d', dStr);
      if (line) {
        line.setAttribute('d', dStr);
        if (conn.isNeutral) line.classList.add('neutral');
        else line.classList.remove('neutral');
      }
    }
  }

  function addBranchConnection(sourceCompId, sourcePortNum, junctionId, type) {
    const junc = junctions.find(j => j.id === junctionId);
    if (!junc) return null;
    const startPt = getPortData(sourceCompId, sourcePortNum);
    if (!startPt) return null;

    const id = generateId('conn_branch');
    const waypoints = calculateOrthogonalPath(startPt, { x: junc.x, y: junc.y, side: null });

    const conn = {
      id: id,
      type: type,
      sourceType: 'port',
      sourceCompId: sourceCompId,
      sourcePortNum: Number(sourcePortNum),
      targetType: 'junction',
      targetJunctionId: junctionId,
      waypoints: waypoints
    };

    connections.push(conn);
    renderConnection(conn);

    const sPort = document.getElementById(`port-${sourceCompId}-${sourcePortNum}`);
    if (sPort) sPort.classList.add('connected');

    updateConnectionCount();
    updateNeutralWires();
    if (!isBatchAction && !isRestoringState) {
      commitState();
    }
    return conn;
  }

  // Helper to recompute and apply neutral (0V/GND) styling on electrical wires
  function updateNeutralWires() {
    const dcSources = workspaceComponents.filter(c => c.defId === 'dc-source');
    const terminals0V = workspaceComponents.filter(c => c.defId === 'terminal-0v');
    const gndStartPorts = [
      ...dcSources.map(dc => `${dc.id}:2`),
      ...terminals0V.map(t => `${t.id}:1`)
    ];

    const neutralWireIds = new Set();
    if (gndStartPorts.length > 0 && typeof SimEngine !== 'undefined' && SimEngine.traverseNet) {
      SimEngine.traverseNet('electrical', gndStartPorts, (wireId) => {
        neutralWireIds.add(wireId);
      });
    }

    connections.forEach(conn => {
      if (conn.type === 'electrical') {
        const isNeutral = neutralWireIds.has(conn.id);
        conn.isNeutral = isNeutral;
        const group = document.getElementById(`conn-${conn.id}`);
        if (!group) return;
        const line = group.querySelector('.connection-line');
        if (!line) return;
        if (isNeutral) {
          line.classList.add('neutral');
        } else {
          line.classList.remove('neutral');
        }
      }
    });

    // Update junction dots if on neutral network
    junctions.forEach(junc => {
      if (junc.type === 'electrical') {
        const circle = document.getElementById(`junc-${junc.id}`);
        if (!circle) return;
        const isNeutral = neutralWireIds.has(junc.parentConnectionId);
        circle.setAttribute('fill', isNeutral ? '#111827' : '#ef4444');
      }
    });
  }

  function updateConnectionsForComponent(compId) {
    connections.forEach(conn => {
      let needsUpdate = false;
      let startPt = null;
      let endPt = null;

      if (conn.sourceType === 'port' && conn.sourceCompId === compId) {
        needsUpdate = true;
      }
      if (conn.targetType === 'port' && conn.targetCompId === compId) {
        needsUpdate = true;
      }

      if (needsUpdate) {
        if (conn.sourceType === 'port') {
          startPt = getPortData(conn.sourceCompId, conn.sourcePortNum);
        } else if (conn.sourceType === 'junction') {
          const j = junctions.find(x => x.id === conn.sourceJunctionId);
          if (j) startPt = { x: j.x, y: j.y, side: null };
        }

        if (conn.targetType === 'port') {
          endPt = getPortData(conn.targetCompId, conn.targetPortNum);
        } else if (conn.targetType === 'junction') {
          const j = junctions.find(x => x.id === conn.targetJunctionId);
          if (j) endPt = { x: j.x, y: j.y, side: null };
        }

        if (startPt && endPt) {
          conn.waypoints = calculateOrthogonalPath(startPt, endPt);
          renderConnection(conn);
        }
      }
    });
  }

  function renderAllConnections() {
    if (DOM.connectionsLayer) DOM.connectionsLayer.innerHTML = '';
    connections.forEach(c => renderConnection(c));
    if (DOM.junctionsLayer) DOM.junctionsLayer.innerHTML = '';
    junctions.forEach(j => renderJunction(j));
  }


  // ============================================================
  // 9. COMPLETE SIMULATION ENGINE (ELEKTROPNEUMATIK REAL-TIME SOLVER)
  // ============================================================

  const SimEngine = {
    isRunning: false,
    speed: 1.0,
    lastTime: 0,
    animFrameId: null,

    // Dynamic states
    buttonStates: {},   // compId -> { pressed: bool, locked: bool }
    valvePositions: {}, // compId -> 'normal' | 'actuated'
    solenoidStates: {}, // tag (e.g. 'Y1') -> bool
    relayStates: {},    // tag (e.g. 'K1') -> bool
    timerOnStates: {},  // compId -> { startTime: number, active: bool }
    timerOffStates: {}, // compId -> { active: bool, deenergizedTime: number | null }
    counterStates: {},  // compId -> { count: number, prevAActive: bool }
    cylinderStates: {}, // compId -> { pos: 0.0, targetPos: 0.0, chamberA: bool, chamberB: bool }
    wirePressure: {},   // connId -> bool
    wireVoltage: {},    // connId -> bool
    lampStates: {},     // compId -> bool

    start: function() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.lastTime = performance.now();
      if (DOM.simLiveStatusText) DOM.simLiveStatusText.textContent = 'Simulasi Aktif (Real-Time)';
      if (DOM.simPlayText) DOM.simPlayText.textContent = 'Jeda';
      if (DOM.simPlayIcon) {
        DOM.simPlayIcon.innerHTML = `<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>`;
      }
      this.loop(performance.now());
    },

    stop: function() {
      this.isRunning = false;
      if (this.animFrameId) {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
      }
      if (DOM.simLiveStatusText) DOM.simLiveStatusText.textContent = 'Simulasi Dijeda';
      if (DOM.simPlayText) DOM.simPlayText.textContent = 'Lanjut';
      if (DOM.simPlayIcon) {
        DOM.simPlayIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"/>`;
      }
    },

    toggle: function() {
      if (this.isRunning) this.stop();
      else this.start();
    },

    setSpeed: function(spd) {
      this.speed = parseFloat(spd) || 1.0;
      const speedBtns = document.querySelectorAll('.btn-speed');
      speedBtns.forEach(btn => {
        if (parseFloat(btn.getAttribute('data-speed')) === this.speed) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
      showToast(`Kecepatan simulasi: ${this.speed}x`, 'info', 1000);
    },

    pressButton: function(compId) {
      const comp = getComponentById(compId);
      const isDetent = comp && (
        comp.defId === 'button-no-detent' ||
        comp.defId === 'button-nc-detent' ||
        comp.defId === 'button-changeover-detent' ||
        (comp.properties && comp.properties.isDetent)
      );

      if (!this.buttonStates[compId]) {
        this.buttonStates[compId] = { pressed: false, locked: false };
      }

      if (isDetent) {
        this.buttonStates[compId].pressed = !this.buttonStates[compId].pressed;
        this.buttonStates[compId].locked = this.buttonStates[compId].pressed;
      } else {
        this.buttonStates[compId].pressed = true;
      }
      this.updateSimulationControlsUI();
    },

    releaseButton: function(compId) {
      const comp = getComponentById(compId);
      const isDetent = comp && (
        comp.defId === 'button-no-detent' ||
        comp.defId === 'button-nc-detent' ||
        comp.defId === 'button-changeover-detent' ||
        (comp.properties && comp.properties.isDetent)
      );

      if (isDetent) {
        return;
      }

      if (this.buttonStates[compId] && !this.buttonStates[compId].locked) {
        this.buttonStates[compId].pressed = false;
      }
      this.updateSimulationControlsUI();
    },

    toggleLockButton: function(compId) {
      if (!this.buttonStates[compId]) {
        this.buttonStates[compId] = { pressed: false, locked: false };
      }
      const st = this.buttonStates[compId];
      st.locked = !st.locked;
      st.pressed = st.locked;
      this.updateSimulationControlsUI();
    },

    releaseAllButtons: function() {
      for (const compId in this.buttonStates) {
        this.buttonStates[compId].pressed = false;
        this.buttonStates[compId].locked = false;
      }
      this.updateSimulationControlsUI();
      showToast('Semua tombol dilepaskan', 'info', 1200);
    },

    reset: function() {
      this.buttonStates = {};
      this.valvePositions = {};
      this.solenoidStates = {};
      this.relayStates = {};
      this.timerOnStates = {};
      this.timerOffStates = {};
      this.counterStates = {};
      this.cylinderStates = {};
      this.wirePressure = {};
      this.wireVoltage = {};
      this.lampStates = {};

      workspaceComponents.forEach(c => {
        if (c.defId === 'cylinder-single' || c.defId === 'cylinder-double') {
          this.cylinderStates[c.id] = { pos: 0.0, targetPos: 0.0, chamberA: false, chamberB: false };
        }
      });

      this.updateVisuals();
      this.updateSimulationControlsUI();
    },

    step: function() {
      this.tick(0.03);
    },

    loop: function(timestamp) {
      if (!SimEngine.isRunning) return;
      const dt = Math.min((timestamp - SimEngine.lastTime) / 1000, 0.05);
      SimEngine.lastTime = timestamp;

      SimEngine.tick(dt);
      SimEngine.animFrameId = requestAnimationFrame(SimEngine.loop);
    },

    tick: function(dt) {
      // 1. Solve Electrical Control Ladder Network
      this.solveElectricalNetwork();

      // 2. Solve Valve Spool Actuations
      this.solveValveActuations();

      // 3. Solve Pneumatic Pressure Propagation
      this.solvePneumaticNetwork();

      // 4. Update Actuator Physics & Piston Movement
      this.solveActuatorPhysics(dt);

      // 5. Update Visuals
      this.updateVisuals();
    },

    // Helper to traverse electrical or pneumatic wire nets (including branch junctions)
    traverseNet: function(type, startPortKeys, onWireTraversed) {
      const visitedPorts = new Set();
      const visitedJunctions = new Set();
      const queue = [];

      startPortKeys.forEach(pk => {
        visitedPorts.add(pk);
        queue.push({ kind: 'port', id: pk });
      });

      const relevantConns = connections.filter(c => c.type === type);
      const relevantJuncs = junctions.filter(j => j.type === type);

      while (queue.length > 0) {
        const item = queue.shift();

        if (item.kind === 'port') {
          const [cId, pNumStr] = item.id.split(':');
          const pNum = Number(pNumStr);

          relevantConns.forEach(conn => {
            if (conn.sourceType === 'port' && conn.sourceCompId === cId && conn.sourcePortNum === pNum) {
              if (onWireTraversed) onWireTraversed(conn.id);
              if (conn.targetType === 'port') {
                const targetKey = `${conn.targetCompId}:${conn.targetPortNum}`;
                if (!visitedPorts.has(targetKey)) {
                  visitedPorts.add(targetKey);
                  queue.push({ kind: 'port', id: targetKey });
                }
              } else if (conn.targetType === 'junction') {
                if (!visitedJunctions.has(conn.targetJunctionId)) {
                  visitedJunctions.add(conn.targetJunctionId);
                  queue.push({ kind: 'junction', id: conn.targetJunctionId });
                }
              }
              relevantJuncs.filter(j => j.parentConnectionId === conn.id).forEach(j => {
                if (!visitedJunctions.has(j.id)) {
                  visitedJunctions.add(j.id);
                  queue.push({ kind: 'junction', id: j.id });
                }
              });
            } else if (conn.targetType === 'port' && conn.targetCompId === cId && conn.targetPortNum === pNum) {
              if (onWireTraversed) onWireTraversed(conn.id);
              if (conn.sourceType === 'port') {
                const srcKey = `${conn.sourceCompId}:${conn.sourcePortNum}`;
                if (!visitedPorts.has(srcKey)) {
                  visitedPorts.add(srcKey);
                  queue.push({ kind: 'port', id: srcKey });
                }
              } else if (conn.sourceType === 'junction') {
                if (!visitedJunctions.has(conn.sourceJunctionId)) {
                  visitedJunctions.add(conn.sourceJunctionId);
                  queue.push({ kind: 'junction', id: conn.sourceJunctionId });
                }
              }
              relevantJuncs.filter(j => j.parentConnectionId === conn.id).forEach(j => {
                if (!visitedJunctions.has(j.id)) {
                  visitedJunctions.add(j.id);
                  queue.push({ kind: 'junction', id: j.id });
                }
              });
            }
          });
        } else if (item.kind === 'junction') {
          const jId = item.id;
          const junc = relevantJuncs.find(j => j.id === jId);

          if (junc && junc.parentConnectionId) {
            const parentConn = relevantConns.find(c => c.id === junc.parentConnectionId);
            if (parentConn) {
              if (onWireTraversed) onWireTraversed(parentConn.id);
              if (parentConn.sourceType === 'port') {
                const sKey = `${parentConn.sourceCompId}:${parentConn.sourcePortNum}`;
                if (!visitedPorts.has(sKey)) {
                  visitedPorts.add(sKey);
                  queue.push({ kind: 'port', id: sKey });
                }
              }
              if (parentConn.targetType === 'port') {
                const tKey = `${parentConn.targetCompId}:${parentConn.targetPortNum}`;
                if (!visitedPorts.has(tKey)) {
                  visitedPorts.add(tKey);
                  queue.push({ kind: 'port', id: tKey });
                }
              }
              relevantJuncs.filter(otherJ => otherJ.parentConnectionId === parentConn.id && otherJ.id !== jId).forEach(otherJ => {
                if (!visitedJunctions.has(otherJ.id)) {
                  visitedJunctions.add(otherJ.id);
                  queue.push({ kind: 'junction', id: otherJ.id });
                }
              });
            }
          }

          relevantConns.filter(c => c.sourceJunctionId === jId || c.targetJunctionId === jId).forEach(branch => {
            if (onWireTraversed) onWireTraversed(branch.id);
            if (branch.sourceType === 'port') {
              const sKey = `${branch.sourceCompId}:${branch.sourcePortNum}`;
              if (!visitedPorts.has(sKey)) {
                visitedPorts.add(sKey);
                queue.push({ kind: 'port', id: sKey });
              }
            }
            if (branch.targetType === 'port') {
              const tKey = `${branch.targetCompId}:${branch.targetPortNum}`;
              if (!visitedPorts.has(tKey)) {
                visitedPorts.add(tKey);
                queue.push({ kind: 'port', id: tKey });
              }
            }
          });
        }
      }

      return visitedPorts;
    },

    // A. ELECTRICAL SOLVER
    solveElectricalNetwork: function() {
      this.wireVoltage = {};
      const dcSources = workspaceComponents.filter(c => c.defId === 'dc-source');
      if (dcSources.length === 0) {
        this.solenoidStates = {};
        this.relayStates = {};
        this.lampStates = {};
        return;
      }

      // Propagate GND backward from 0V terminal (Port 2) and Terminal 0V (Port 1) across all wires and junctions
      const terminals0V = workspaceComponents.filter(c => c.defId === 'terminal-0v');
      const gndStartPorts = [
        ...dcSources.map(dc => `${dc.id}:2`),
        ...terminals0V.map(t => `${t.id}:1`)
      ];
      const gndNodes = this.traverseNet('electrical', gndStartPorts);

      for (let pass = 0; pass < 3; pass++) {
        const passSolenoids = {};
        const passRelays = {};
        const passLamps = {};

        const conductsComp = (comp, fromPort, toPort) => {
          if (comp.defId === 'button-no' || comp.defId === 'button-no-detent') {
            const st = this.buttonStates[comp.id];
            return st && st.pressed;
          }
          if (comp.defId === 'button-nc' || comp.defId === 'button-nc-detent') {
            const st = this.buttonStates[comp.id];
            return !st || !st.pressed;
          }
          if (comp.defId === 'button-changeover' || comp.defId === 'button-changeover-detent') {
            const st = this.buttonStates[comp.id];
            const isPressed = st && st.pressed;
            // Port 1 = Pin 11 (COM), Port 2 = Pin 12 (NC), Port 3 = Pin 14 (NO)
            if (!isPressed) {
              return (fromPort === 1 && toPort === 2) || (fromPort === 2 && toPort === 1);
            } else {
              return (fromPort === 1 && toPort === 3) || (fromPort === 3 && toPort === 1);
            }
          }
          if (comp.defId === 'relay-contact-no') {
            const ref = (comp.properties && comp.properties.relayRef) || 'K1';
            return !!this.relayStates[ref];
          }
          if (comp.defId === 'relay-contact-nc') {
            const ref = (comp.properties && comp.properties.relayRef) || 'K1';
            return !this.relayStates[ref];
          }
          if (comp.defId === 'limit-switch') {
            const ref = (comp.properties && comp.properties.limitSwitchRef) || '1S2';
            return this.isLimitSwitchTriggered(ref);
          }
          return false;
        };

        const positiveNodes = new Set();
        const startPorts = dcSources.map(dc => `${dc.id}:1`);
        const compQueue = [...startPorts];
        startPorts.forEach(p => positiveNodes.add(p));

        while (compQueue.length > 0) {
          const currPort = compQueue.shift();

          const reachedPorts = this.traverseNet('electrical', [currPort], (wireId) => {
            this.wireVoltage[wireId] = true;
          });

          reachedPorts.forEach(portKey => {
            if (!positiveNodes.has(portKey)) {
              positiveNodes.add(portKey);
              compQueue.push(portKey);
            }

            const [cId, pNumStr] = portKey.split(':');
            const pNum = Number(pNumStr);
            const comp = getComponentById(cId);

            if (comp) {
              comp.ports.filter(p => p.type === 'electrical' && p.portNumber !== pNum).forEach(otherPort => {
                if (conductsComp(comp, pNum, otherPort.portNumber)) {
                  const otherKey = `${comp.id}:${otherPort.portNumber}`;
                  if (!positiveNodes.has(otherKey)) {
                    positiveNodes.add(otherKey);
                    compQueue.push(otherKey);
                  }
                }
              });
            }
          });
        }

        const now = performance.now();

        workspaceComponents.forEach(comp => {
          if (comp.defId === 'solenoid-coil') {
            const p1Pos = positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`);
            const p2Pos = positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`);
            const tag = (comp.properties && comp.properties.solenoidRef) || comp.label || 'Y1';
            if (p1Pos || p2Pos) {
              passSolenoids[tag] = true;
            }
          } else if (comp.defId === 'relay') {
            const p1Pos = positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`);
            const p2Pos = positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`);
            const tag = (comp.properties && (comp.properties.relayId || comp.properties.relayRef)) || comp.label || 'K1';
            if (p1Pos || p2Pos) {
              passRelays[tag] = true;
            }
          } else if (comp.defId === 'timer-on-delay') {
            const p1Pos = positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`);
            const p2Pos = positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`);
            const isEnergized = p1Pos || p2Pos;
            const tag = (comp.properties && (comp.properties.relayRef || comp.properties.relayId)) || comp.label || 'K2';
            const timeSec = (comp.properties && comp.properties.timeSec !== undefined) ? Math.max(0.1, Math.min(999, parseFloat(comp.properties.timeSec) || 5)) : 5;

            if (isEnergized) {
              if (!this.timerOnStates[comp.id]) {
                this.timerOnStates[comp.id] = { startTime: now, energized: true, timedOut: false };
              } else {
                this.timerOnStates[comp.id].energized = true;
              }
              const elapsed = (now - this.timerOnStates[comp.id].startTime) / 1000;
              if (elapsed >= timeSec) {
                this.timerOnStates[comp.id].timedOut = true;
                passRelays[tag] = true;
              }
            } else {
              delete this.timerOnStates[comp.id];
            }
          } else if (comp.defId === 'timer-off-delay') {
            const p1Pos = positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`);
            const p2Pos = positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`);
            const isEnergized = p1Pos || p2Pos;
            const tag = (comp.properties && (comp.properties.relayRef || comp.properties.relayId)) || comp.label || 'K3';
            const timeSec = (comp.properties && comp.properties.timeSec !== undefined) ? Math.max(0.1, Math.min(999, parseFloat(comp.properties.timeSec) || 5)) : 5;

            if (isEnergized) {
              this.timerOffStates[comp.id] = { energized: true, deenergizedTime: null };
              passRelays[tag] = true;
            } else {
              const st = this.timerOffStates[comp.id];
              if (st) {
                if (st.deenergizedTime === null) {
                  st.deenergizedTime = now;
                  st.energized = false;
                }
                const elapsed = (now - st.deenergizedTime) / 1000;
                if (elapsed < timeSec) {
                  passRelays[tag] = true;
                } else {
                  delete this.timerOffStates[comp.id];
                }
              }
            }
          } else if (comp.defId === 'counter') {
            const isAActive = (positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`)) || (positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`));
            const isRActive = (positiveNodes.has(`${comp.id}:3`) && gndNodes.has(`${comp.id}:4`)) || (positiveNodes.has(`${comp.id}:4`) && gndNodes.has(`${comp.id}:3`));
            const tag = (comp.properties && (comp.properties.relayRef || comp.properties.relayId)) || comp.label || 'K4';
            const preset = (comp.properties && comp.properties.presetCount !== undefined) ? Math.max(1, Math.min(999, parseInt(comp.properties.presetCount, 10) || 5)) : 5;

            if (!this.counterStates[comp.id]) {
              this.counterStates[comp.id] = { count: 0, prevAActive: false };
            }
            const cState = this.counterStates[comp.id];

            if (isRActive) {
              cState.count = 0;
              cState.prevAActive = isAActive;
            } else {
              if (pass === 0 && isAActive && !cState.prevAActive) {
                cState.count = (cState.count || 0) + 1;
              }
              cState.prevAActive = isAActive;
              if (cState.count >= preset) {
                passRelays[tag] = true;
              }
            }
          } else if (comp.defId === 'indicator-lamp') {
            const p1Pos = positiveNodes.has(`${comp.id}:1`) && gndNodes.has(`${comp.id}:2`);
            const p2Pos = positiveNodes.has(`${comp.id}:2`) && gndNodes.has(`${comp.id}:1`);
            if (p1Pos || p2Pos) {
              passLamps[comp.id] = true;
            }
          }
        });

        this.solenoidStates = passSolenoids;
        this.relayStates = passRelays;
        this.lampStates = passLamps;
      }
    },

    isLimitSwitchTriggered: function(tag) {
      if (!tag) return false;
      const cleanTag = String(tag).trim();

      // Check if tag specifies a cylinder prefix (e.g. "1S1" or "1S2" -> cylinder 1, "2S1" or "2S2" -> cylinder 2)
      let targetCylIndex = 0;
      const match = cleanTag.match(/^([0-9]+)S/i);
      if (match) {
        targetCylIndex = parseInt(match[1], 10) - 1;
      }

      const cylEntries = Object.keys(this.cylinderStates).map(compId => ({
        compId,
        comp: getComponentById(compId),
        state: this.cylinderStates[compId]
      })).filter(e => e.comp && (e.comp.defId === 'cylinder-single' || e.comp.defId === 'cylinder-double'));

      let targetCyl = null;
      if (cylEntries.length > 0) {
        targetCyl = cylEntries.find(e => {
          const lbl = (e.comp.label || '').toUpperCase();
          return lbl.includes(`A${targetCylIndex + 1}`) || lbl.includes(`${targetCylIndex + 1}.0`) || lbl.includes(`${targetCylIndex + 1}`);
        });
        if (!targetCyl && targetCylIndex >= 0 && targetCylIndex < cylEntries.length) {
          targetCyl = cylEntries[targetCylIndex];
        }
      }

      const isRetractCheck = cleanTag.endsWith('1') || cleanTag.toLowerCase().includes('retract') || cleanTag.toLowerCase().includes('min');
      const isExtendCheck = cleanTag.endsWith('2') || cleanTag.toLowerCase().includes('extend') || cleanTag.toLowerCase().includes('max');

      if (targetCyl) {
        if (isRetractCheck && targetCyl.state.pos < 0.08) return true;
        if (isExtendCheck && targetCyl.state.pos > 0.92) return true;
      } else {
        for (const entry of cylEntries) {
          if (isRetractCheck && entry.state.pos < 0.08) return true;
          if (isExtendCheck && entry.state.pos > 0.92) return true;
        }
      }
      return false;
    },

    // B. VALVE SPOOL SOLVER
    solveValveActuations: function() {
      workspaceComponents.forEach(comp => {
        if (comp.type !== 'pneumatic' || comp.category !== 'valve') return;

        const props = comp.properties || {};
        const actLeft = props.actuationLeft || 'push-button';
        const actRight = props.actuationRight || 'spring';
        let leftActive = false;
        let rightActive = false;

        // Check Left Actuation
        if (actLeft === 'push-button') {
          const st = this.buttonStates[comp.id];
          if (st && st.pressed) leftActive = true;
        } else if (actLeft === 'solenoid') {
          const tag = props.solenoidRef || comp.label || 'Y1';
          if (this.solenoidStates[tag]) leftActive = true;
        } else if (actLeft === 'pilot') {
          // Check if pilot port (Port 6 / Port 14) has pressure
          leftActive = this.isPortPressurized(comp.id, 6) || this.isPortPressurized(comp.id, 14);
        } else if (actLeft === 'roller') {
          leftActive = this.isLimitSwitchTriggered('1S2');
        }

        // Check Right Actuation
        if (actRight === 'spring') {
          rightActive = !leftActive; // Spring return acts when left is off
        } else if (actRight === 'solenoid') {
          const tag2 = props.solenoidRightRef || 'Y2';
          if (this.solenoidStates[tag2]) rightActive = true;
        } else if (actRight === 'pilot') {
          rightActive = this.isPortPressurized(comp.id, 7) || this.isPortPressurized(comp.id, 12);
        }

        // Spool position update
        if (leftActive) {
          this.valvePositions[comp.id] = 'actuated';
        } else if (rightActive) {
          this.valvePositions[comp.id] = 'normal';
        } else {
          // Bi-stable / memory: retains last position if no signal
          if (!this.valvePositions[comp.id]) {
            this.valvePositions[comp.id] = 'normal';
          }
        }
      });
    },

    // C. PNEUMATIC NETWORK SOLVER
    solvePneumaticNetwork: function() {
      this.wirePressure = {};
      const pressurizedPorts = new Set();

      // 1. Identify Air Sources (Compressor)
      const airSourcePorts = [];
      workspaceComponents.forEach(comp => {
        if (comp.defId === 'compressor') {
          airSourcePorts.push(`${comp.id}:1`); // Port 1 (OUT)
        }
      });

      const queue = [...airSourcePorts];
      airSourcePorts.forEach(p => pressurizedPorts.add(p));

      while (queue.length > 0) {
        const currPort = queue.shift();

        const reachedPorts = this.traverseNet('pneumatic', [currPort], (wireId) => {
          this.wirePressure[wireId] = true;
        });

        reachedPorts.forEach(portKey => {
          if (!pressurizedPorts.has(portKey)) {
            pressurizedPorts.add(portKey);
            queue.push(portKey);
          }

          const [cId, pNumStr] = portKey.split(':');
          const pNum = Number(pNumStr);
          const comp = getComponentById(cId);

          if (comp) {
            if (comp.defId === 'frl-unit' && pNum === 1) {
              const outKey = `${comp.id}:2`;
              if (!pressurizedPorts.has(outKey)) {
                pressurizedPorts.add(outKey);
                queue.push(outKey);
              }
            } else if (comp.defId === 'pilot-line' && pNum === 1) {
              const outKey = `${comp.id}:2`;
              if (!pressurizedPorts.has(outKey)) {
                pressurizedPorts.add(outKey);
                queue.push(outKey);
              }
            } else if (comp.category === 'valve') {
              const spool = this.valvePositions[comp.id] || 'normal';

              if (comp.defId === 'valve-3-2' || comp.defId === 'valve-3-2-push' || comp.defId === 'valve-3-2-roller') {
                if (pNum === 1 && spool === 'actuated') {
                  const outKey = `${comp.id}:2`;
                  if (!pressurizedPorts.has(outKey)) {
                    pressurizedPorts.add(outKey);
                    queue.push(outKey);
                  }
                }
              } else if (comp.defId === 'valve-5-2' || comp.defId === 'valve-5-2-pilot' || comp.defId === 'valve-5-2-solenoid') {
                if (pNum === 1) {
                  if (spool === 'actuated') {
                    const outKey = `${comp.id}:4`;
                    if (!pressurizedPorts.has(outKey)) {
                      pressurizedPorts.add(outKey);
                      queue.push(outKey);
                    }
                  } else {
                    const outKey = `${comp.id}:2`;
                    if (!pressurizedPorts.has(outKey)) {
                      pressurizedPorts.add(outKey);
                      queue.push(outKey);
                    }
                  }
                }
              }
            } else if (comp.defId === 'valve-or') {
              if (pNum === 1 || pNum === 2) {
                const outKey = `${comp.id}:3`;
                if (!pressurizedPorts.has(outKey)) {
                  pressurizedPorts.add(outKey);
                  queue.push(outKey);
                }
              }
            } else if (comp.defId === 'valve-and') {
              const p1Pres = pressurizedPorts.has(`${comp.id}:1`);
              const p2Pres = pressurizedPorts.has(`${comp.id}:2`);
              if (p1Pres && p2Pres) {
                const outKey = `${comp.id}:3`;
                if (!pressurizedPorts.has(outKey)) {
                  pressurizedPorts.add(outKey);
                  queue.push(outKey);
                }
              }
            }
          }
        });
      }

      this._pressurizedPorts = pressurizedPorts;
    },

    isPortPressurized: function(compId, portNum) {
      return this._pressurizedPorts && this._pressurizedPorts.has(`${compId}:${portNum}`);
    },

    // D. ACTUATOR PHYSICS & MOTION SOLVER
    solveActuatorPhysics: function(dt) {
      workspaceComponents.forEach(comp => {
        if (comp.defId === 'cylinder-single') {
          if (!this.cylinderStates[comp.id]) {
            this.cylinderStates[comp.id] = { pos: 0.0, targetPos: 0.0, chamberA: false, chamberB: false };
          }
          const cyl = this.cylinderStates[comp.id];
          const hasPres = this.isPortPressurized(comp.id, 1);
          cyl.chamberA = hasPres;

          // Single-acting: air extends, spring retracts
          cyl.targetPos = hasPres ? 1.0 : 0.0;
          const moveSpeed = 3.8 * dt * this.speed;
          cyl.pos += (cyl.targetPos - cyl.pos) * Math.min(moveSpeed, 1.0);
          cyl.pos = Math.max(0.0, Math.min(1.0, cyl.pos));

        } else if (comp.defId === 'cylinder-double') {
          if (!this.cylinderStates[comp.id]) {
            this.cylinderStates[comp.id] = { pos: 0.0, targetPos: 0.0, chamberA: false, chamberB: false };
          }
          const cyl = this.cylinderStates[comp.id];
          const pA = this.isPortPressurized(comp.id, 1); // Port A (Maju / Cap End)
          const pB = this.isPortPressurized(comp.id, 2); // Port B (Mundur / Rod End)
          cyl.chamberA = pA;
          cyl.chamberB = pB;

          if (pA && !pB) {
            cyl.targetPos = 1.0; // Advance
          } else if (!pA && pB) {
            cyl.targetPos = 0.0; // Retract
          } else if (pA && pB) {
            // Area differential: Cap area > Rod area -> slow advance
            cyl.targetPos = 1.0;
          }
          // If neither, friction holds current position

          const moveSpeed = 4.2 * dt * this.speed;
          cyl.pos += (cyl.targetPos - cyl.pos) * Math.min(moveSpeed, 1.0);
          cyl.pos = Math.max(0.0, Math.min(1.0, cyl.pos));
        }
      });
    },

    // E. VISUAL UPDATE TO DOM & SVG
    updateVisuals: function() {
      // 1. Update Wires Classes (pressurized & energized flow animations)
      connections.forEach(conn => {
        const group = document.getElementById(`conn-${conn.id}`);
        if (!group) return;
        const line = group.querySelector('.connection-line');
        if (!line) return;

        if (conn.type === 'pneumatic') {
          if (this.wirePressure[conn.id]) {
            line.classList.add('pressurized');
          } else {
            line.classList.remove('pressurized');
          }
        } else if (conn.type === 'electrical') {
          if (this.wireVoltage[conn.id]) {
            line.classList.add('energized');
          } else {
            line.classList.remove('energized');
          }
        }
      });

      if (typeof updateNeutralWires === 'function') updateNeutralWires();

      // 2. Update Component Symbols
      workspaceComponents.forEach(comp => {
        const dyn = {};

        if (comp.defId === 'compressor') {
          dyn.running = true;
        } else if (comp.category === 'valve') {
          dyn.isActuated = this.valvePositions[comp.id] === 'actuated';
        } else if (comp.defId === 'cylinder-single' || comp.defId === 'cylinder-double') {
          const cState = this.cylinderStates[comp.id];
          if (cState) {
            dyn.pistonPos = cState.pos;
            dyn.chamberA = cState.chamberA;
            dyn.chamberB = cState.chamberB;
          }
        } else if (comp.defId.startsWith('button-')) {
          const st = this.buttonStates[comp.id];
          dyn.pressed = st ? st.pressed : false;
        } else if (comp.defId === 'relay') {
          const tag = (comp.properties && comp.properties.relayId) || comp.label || 'K1';
          dyn.energized = !!this.relayStates[tag];
        } else if (comp.defId === 'relay-contact-no') {
          const tag = (comp.properties && comp.properties.relayRef) || 'K1';
          dyn.closed = !!this.relayStates[tag];
        } else if (comp.defId === 'relay-contact-nc') {
          const tag = (comp.properties && comp.properties.relayRef) || 'K1';
          dyn.open = !!this.relayStates[tag];
        } else if (comp.defId === 'solenoid-coil') {
          const tag = (comp.properties && comp.properties.solenoidRef) || comp.label || 'Y1';
          dyn.energized = !!this.solenoidStates[tag];
        } else if (comp.defId === 'timer-on-delay') {
          const tState = this.timerOnStates[comp.id];
          dyn.energized = tState ? tState.energized : false;
        } else if (comp.defId === 'timer-off-delay') {
          const tState = this.timerOffStates[comp.id];
          dyn.energized = tState ? tState.energized : false;
        } else if (comp.defId === 'counter') {
          const cState = this.counterStates[comp.id];
          const tag = (comp.properties && (comp.properties.relayRef || comp.properties.relayId)) || comp.label || 'K4';
          dyn.energized = !!this.relayStates[tag];
          dyn.count = cState ? cState.count : 0;
        } else if (comp.defId === 'limit-switch') {
          const ref = (comp.properties && comp.properties.limitSwitchRef) || '1S2';
          dyn.tripped = this.isLimitSwitchTriggered(ref);
        } else if (comp.defId === 'indicator-lamp') {
          dyn.lit = !!(this.lampStates && this.lampStates[comp.id]);
        }

        const group = document.getElementById(`comp-${comp.id}`);
        if (group) {
          const symbolContainer = group.querySelector('.symbol-content');
          if (symbolContainer) {
            symbolContainer.innerHTML = renderComponentSymbol(comp, dyn);
          }
        }
      });
    },

    // F. UPDATE BOTTOM SIMULATION CONTROLS BAR
    updateSimulationControlsUI: function() {
      if (!DOM.simInteractiveButtons) return;

      // Find all interactive push buttons in the circuit
      const buttons = workspaceComponents.filter(c =>
        c.defId.startsWith('button-') ||
        c.defId === 'valve-3-2' ||
        c.defId === 'valve-3-2-push' ||
        c.defId === 'pneumatic-push-button' ||
        (c.properties && c.properties.actuationLeft === 'push-button')
      );

      if (buttons.length === 0) {
        DOM.simInteractiveButtons.innerHTML = `<span class="sim-no-buttons-hint">Tidak ada tombol interaktif di rangkaian</span>`;
        return;
      }

      let html = '';
      buttons.forEach(btn => {
        const st = this.buttonStates[btn.id] || { pressed: false, locked: false };
        const isPres = st.pressed;
        const isLock = st.locked;
        const isDetent = btn.defId === 'button-no-detent' ||
                         btn.defId === 'button-nc-detent' ||
                         btn.defId === 'button-changeover-detent' ||
                         (btn.properties && btn.properties.isDetent);

        if (isDetent) {
          html += `
            <div class="sim-btn-group" data-comp-id="${btn.id}" data-is-detent="true">
              <span class="sim-btn-label">${btn.label} (Detent)</span>
              <button class="sim-btn-press ${isPres ? 'active' : ''}" data-action="toggle" title="Klik untuk mengaktifkan / melepas status detent switch">
                ${isPres ? '🔒 Aktif (Latched)' : '◯ Buka (Normal)'}
              </button>
            </div>
          `;
        } else {
          html += `
            <div class="sim-btn-group" data-comp-id="${btn.id}">
              <span class="sim-btn-label">${btn.label} (${btn.name.split(' ')[0]})</span>
              <button class="sim-btn-press ${isPres ? 'active' : ''}" data-action="press" title="Tekan dan tahan tombol">
                ${isPres ? '● Ditekan' : 'Tekan'}
              </button>
              <button class="sim-btn-toggle ${isLock ? 'active' : ''}" data-action="lock" title="Kunci / Latch tombol agar tetap aktif">
                ${isLock ? '🔒 Terkunci' : 'Kunci'}
              </button>
            </div>
          `;
        }
      });

      DOM.simInteractiveButtons.innerHTML = html;

      // Attach button event listeners
      const groups = DOM.simInteractiveButtons.querySelectorAll('.sim-btn-group');
      groups.forEach(g => {
        const cId = g.getAttribute('data-comp-id');
        const pressBtn = g.querySelector('[data-action="press"]');
        const lockBtn = g.querySelector('[data-action="lock"]');
        const toggleBtn = g.querySelector('[data-action="toggle"]');

        if (toggleBtn) {
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            SimEngine.pressButton(cId);
          });
        }

        if (pressBtn) {
          pressBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            SimEngine.pressButton(cId);
          });
          pressBtn.addEventListener('mouseup', (e) => {
            e.stopPropagation();
            SimEngine.releaseButton(cId);
          });
          pressBtn.addEventListener('mouseleave', (e) => {
            SimEngine.releaseButton(cId);
          });
          // Touch support for mobile/tablets
          pressBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            SimEngine.pressButton(cId);
          });
          pressBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            SimEngine.releaseButton(cId);
          });
        }

        if (lockBtn) {
          lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            SimEngine.toggleLockButton(cId);
          });
        }
      });
    }
  };


  // ============================================================
  // 10. PRESET CIRCUITS GENERATOR (CONTOH RANGKAIAN RESMI KELAS XI TITL)
  // ============================================================

  function loadPresetCircuit(materialId) {
    if (materialId === 1 || materialId === '1') materialId = 'direct';
    if (materialId === 2 || materialId === '2') materialId = 'indirect';
    if (materialId === 3 || materialId === '3') materialId = 'electropneumatic';

    const wasBatch = isBatchAction;
    isBatchAction = true;
    try {
      // 1. Clear workspace
      clearAllComponents(true);

    if (materialId === 'direct') {
      // ===== MATERI 1: RANGKAIAN PNEUMATIK LANGSUNG =====
      const c1 = addComponent('compressor', 120, 360, { label: 'Kompresor' });
      const frl = addComponent('frl-unit', 240, 360, { label: 'FRL' });
      const v1 = addComponent('valve-3-2', 380, 360, {
        label: 'V1',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'closed'
      });
      const cyl = addComponent('cylinder-single', 380, 160, { label: 'A1' });

      // Wiring/Tubing Connections:
      // Kompresor OUT(1) -> FRL IN(1)
      addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      // FRL OUT(2) -> Katup 3/2 P(1)
      addConnection(frl.id, 2, v1.id, 1, 'pneumatic');
      // Katup 3/2 A(2) -> Silinder IN(1)
      addConnection(v1.id, 2, cyl.id, 1, 'pneumatic');

      zoomToFit();
      showToast('Contoh Rangkaian Pneumatik Langsung berhasil dimuat!', 'success', 2500);

    } else if (materialId === 'indirect') {
      // ===== MATERI 2: RANGKAIAN PNEUMATIK TAK LANGSUNG =====
      const c1 = addComponent('compressor', 120, 380, { label: 'Kompresor' });
      const frl = addComponent('frl-unit', 240, 380, { label: 'FRL' });
      const pb1 = addComponent('valve-3-2', 360, 380, {
        label: 'PB1',
        actuationLeft: 'push-button',
        actuationRight: 'spring',
        normalPosition: 'closed'
      });
      const mainValve = addComponent('valve-5-2-pilot', 540, 380, {
        label: 'V1 (5/2)',
        actuationLeft: 'pilot',
        actuationRight: 'spring',
        normalPosition: 'position-a'
      });
      const cyl = addComponent('cylinder-double', 540, 160, { label: 'A1' });

      // Tubing:
      // Kompresor -> FRL
      addConnection(c1.id, 1, frl.id, 1, 'pneumatic');

      // FRL OUT -> Katup Utama 5/2 Port 1(P)
      const mainPneuConn = addConnection(frl.id, 2, mainValve.id, 1, 'pneumatic');

      // Percabangan pasokan udara ke PB1 Port 1(P) di bawah
      const branchJunc = addJunction(mainPneuConn.id, 300, 420, 'pneumatic');
      addBranchConnection(pb1.id, 1, branchJunc.id, 'pneumatic');

      // Katup Kendali PB1 Port 2(A) -> Katup Utama 5/2 Port 14 (Port 6 Pilot)
      addConnection(pb1.id, 2, mainValve.id, 6, 'pneumatic');

      // Katup Utama 5/2 Port 4(B) -> Silinder Kerja Ganda Port A (Maju)
      addConnection(mainValve.id, 4, cyl.id, 1, 'pneumatic');

      // Katup Utama 5/2 Port 2(A) -> Silinder Kerja Ganda Port B (Mundur)
      addConnection(mainValve.id, 2, cyl.id, 2, 'pneumatic');

      zoomToFit();
      showToast('Contoh Rangkaian Pneumatik Tak Langsung berhasil dimuat!', 'success', 2500);

    } else if (materialId === 'electropneumatic') {
      // ===== MATERI 3: RANGKAIAN ELEKTROPNEUMATIK =====
      // Bagian Atas: Diagram Pneumatik Daya
      const c1 = addComponent('compressor', 120, 160, { label: 'Kompresor' });
      const frl = addComponent('frl-unit', 240, 160, { label: 'FRL' });
      const solValve = addComponent('valve-5-2-solenoid', 420, 240, {
        label: 'V1',
        actuationLeft: 'solenoid',
        actuationRight: 'spring',
        solenoidRef: 'Y1'
      });
      const cyl = addComponent('cylinder-double', 420, 100, { label: 'A1' });

      addConnection(c1.id, 1, frl.id, 1, 'pneumatic');
      addConnection(frl.id, 2, solValve.id, 1, 'pneumatic');
      addConnection(solValve.id, 4, cyl.id, 1, 'pneumatic'); // Maju
      addConnection(solValve.id, 2, cyl.id, 2, 'pneumatic'); // Mundur

      // Bagian Bawah: Diagram Kelistrikan Kendali 24V DC (Ladder Schematic)
      const dc = addComponent('dc-source', 120, 360, { label: '24V DC' });
      const s1 = addComponent('button-no', 250, 420, { label: 'S1 (Start)' });
      // Kontak Relai NO K1 paralel dengan S1 (diputar 90 derajat agar port 13 di top dan 14 di bottom)
      const k1Contact = addComponent('relay-contact-no', 340, 420, {
        label: 'K1-1',
        relayRef: 'K1',
        rotation: 90
      });

      const rly = addComponent('relay', 295, 520, { label: 'K1', relayId: 'K1', relayRef: 'K1' });
      const sol = addComponent('solenoid-coil', 440, 520, { label: 'Y1', solenoidRef: 'Y1' });
      const lamp = addComponent('indicator-lamp', 560, 520, { label: 'H1' });

      // Wiring Listrik:
      // Rel Daya +24V (atas):
      const pwrRail = addConnection(dc.id, 1, s1.id, 1, 'electrical');

      // Cabang +24V ke Kontak K1-1 Port 1 (pin 13)
      const juncPwr = addJunction(pwrRail.id, 200, 360, 'electrical');
      addBranchConnection(k1Contact.id, 1, juncPwr.id, 'electrical');

      // Jalur pengunci keluaran: S1 Port 2 (pin 14) ke Relai K1 Port 1 (A1)
      const latchLine = addConnection(s1.id, 2, rly.id, 1, 'electrical');

      // Cabang paralel dari Kontak K1-1 Port 2 (pin 14) ke latchLine
      const juncLatch = addJunction(latchLine.id, 295, 470, 'electrical');
      addBranchConnection(k1Contact.id, 2, juncLatch.id, 'electrical');

      // Cabang kontrol dari pengunci ke Kumparan Solenoid Y1 Port 1 (A1)
      addBranchConnection(sol.id, 1, juncLatch.id, 'electrical');

      // Cabang kontrol dari pengunci ke Lampu H1 Port 1 (X1)
      addBranchConnection(lamp.id, 1, juncLatch.id, 'electrical');

      // Rel Netral 0V (GND, bawah):
      const gndLine = addConnection(rly.id, 2, dc.id, 2, 'electrical');

      // Cabang netral dari Solenoid Y1 Port 2 (A2) ke gndLine
      const juncGnd1 = addJunction(gndLine.id, 440, 580, 'electrical');
      addBranchConnection(sol.id, 2, juncGnd1.id, 'electrical');

      // Cabang netral dari Lampu H1 Port 2 (X2) ke gndLine
      const juncGnd2 = addJunction(gndLine.id, 560, 580, 'electrical');
      addBranchConnection(lamp.id, 2, juncGnd2.id, 'electrical');

      zoomToFit();
      if (typeof updateNeutralWires === 'function') updateNeutralWires();
      showToast('Contoh Rangkaian Elektropneumatik berhasil dimuat!', 'success', 2500);
    }

      if (typeof updateNeutralWires === 'function') updateNeutralWires();
      // Refresh simulation UI & controls
      SimEngine.reset();
    } finally {
      isBatchAction = wasBatch;
    }

    if (!isBatchAction && !isRestoringState) {
      commitState();
    }
  }


  // ============================================================
  // 11. LEARNING MODULE & INTERACTIVE QUIZ ENGINE
  // ============================================================

  function showMaterialView() {
    AppState.activeView = 'material';
    if (DOM.materialInfo) {
      DOM.materialInfo.style.display = 'block';
      DOM.materialInfo.scrollTop = 0;
    }
    if (DOM.workspaceArea) {
      DOM.workspaceArea.style.display = 'none';
    }
    if (AppState.activeMaterial && materials[AppState.activeMaterial]) {
      const mat = materials[AppState.activeMaterial];
      if (DOM.btnShowMaterial) {
        DOM.btnShowMaterial.style.display = 'inline-flex';
        const txt = DOM.btnShowMaterial.querySelector('.btn-text');
        if (txt) txt.textContent = `Buka ${mat.badge}`;
      }
      if (DOM.headerMaterialBadge) {
        DOM.headerMaterialBadge.style.display = 'inline-block';
        DOM.headerMaterialBadge.textContent = mat.badge;
      }
    }
  }

  function showWorkspaceView() {
    AppState.activeView = 'workspace';
    if (DOM.materialInfo) {
      DOM.materialInfo.style.display = 'none';
    }
    if (DOM.workspaceArea) {
      DOM.workspaceArea.style.display = 'flex';
    }
    if (AppState.activeMaterial && materials[AppState.activeMaterial]) {
      const mat = materials[AppState.activeMaterial];
      if (DOM.btnShowMaterial) {
        DOM.btnShowMaterial.style.display = 'inline-flex';
        const txt = DOM.btnShowMaterial.querySelector('.btn-text');
        if (txt) txt.textContent = `Buka ${mat.badge}`;
      }
      if (DOM.headerMaterialBadge) {
        DOM.headerMaterialBadge.style.display = 'inline-block';
        DOM.headerMaterialBadge.textContent = mat.badge;
      }
    } else {
      if (DOM.btnShowMaterial) DOM.btnShowMaterial.style.display = 'none';
      if (DOM.headerMaterialBadge) DOM.headerMaterialBadge.style.display = 'none';
    }
    updateViewBox();
    updateEmptyMessage();
  }

  function selectMaterial(materialId) {
    const mat = materials[materialId];
    if (!mat) return;

    AppState.activeMaterial = materialId;
    highlightActiveMaterial(materialId);

    // Header badge
    if (DOM.headerMaterialBadge) {
      DOM.headerMaterialBadge.style.display = 'inline-block';
      DOM.headerMaterialBadge.textContent = mat.badge;
    }

    if (DOM.btnShowMaterial) {
      DOM.btnShowMaterial.style.display = 'inline-flex';
      const txt = DOM.btnShowMaterial.querySelector('.btn-text');
      if (txt) txt.textContent = `Buka ${mat.badge}`;
    }

    // Material panel show
    if (DOM.materialBadge) {
      DOM.materialBadge.textContent = mat.badge;
    }
    if (DOM.materialTitle) {
      DOM.materialTitle.textContent = `${mat.title} (${mat.subtitle})`;
    }
    if (DOM.materialDescription) {
      DOM.materialDescription.textContent = mat.description;
    }

    // Objectives list
    if (DOM.objectivesList) {
      DOM.objectivesList.innerHTML = mat.objectives.map(obj => `<li>${obj}</li>`).join('');
    }

    // Components list
    if (DOM.componentListItems) {
      DOM.componentListItems.innerHTML = mat.components.map(c => `<li>${c}</li>`).join('');
    }

    // Extended Theory
    if (DOM.materialExtendedTheory) {
      DOM.materialExtendedTheory.innerHTML = mat.theoryText || '';
    }

    // Steps
    renderPracticalSteps(mat.steps || []);

    // Quiz
    renderQuiz(mat.quiz || []);

    // Analysis
    renderDiagnosticsPanel();

    // Default to theory tab
    switchMaterialTab('theory');

    // Show Material View in full screen (hiding workspace)
    showMaterialView();

    showToast(`Materi Dibuka: ${mat.title}`, 'info', 2000);
  }

  function closeMaterialInfo() {
    AppState.activeMaterial = null;
    showWorkspaceView();
    if (DOM.btnShowMaterial) DOM.btnShowMaterial.style.display = 'none';
    if (DOM.headerMaterialBadge) DOM.headerMaterialBadge.style.display = 'none';
    highlightActiveMaterial(null);
  }

  function highlightActiveMaterial(activeId) {
    if (!DOM.materialNav) return;
    const items = DOM.materialNav.querySelectorAll('.material-item');
    items.forEach(item => {
      const matId = item.getAttribute('data-material');
      if (matId === activeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function switchMaterialTab(tabName) {
    AppState.activeTab = tabName;
    if (DOM.materialInfo) {
      DOM.materialInfo.scrollTop = 0;
    }
    const tabBtns = document.querySelectorAll('.material-tab-btn');
    tabBtns.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const panels = {
      theory: document.getElementById('tab-content-theory'),
      steps: document.getElementById('tab-content-steps'),
      quiz: document.getElementById('tab-content-quiz'),
      analysis: document.getElementById('tab-content-analysis')
    };

    for (const key in panels) {
      if (panels[key]) {
        if (key === tabName) panels[key].classList.add('active');
        else panels[key].classList.remove('active');
      }
    }

    if (tabName === 'analysis') {
      renderDiagnosticsPanel();
    }
  }

  function renderPracticalSteps(steps) {
    if (!DOM.materialStepsContainer) return;
    let html = '';
    steps.forEach(step => {
      html += `
        <div class="step-card">
          <div class="step-number">${step.num}</div>
          <div class="step-content">
            <h4>${step.title}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `;
    });
    DOM.materialStepsContainer.innerHTML = html;
  }

  function renderQuiz(quizList) {
    if (!DOM.quizContainer) return;
    if (!quizList || quizList.length === 0) {
      DOM.quizContainer.innerHTML = `<p style="font-size:12px; color:#64748b;">Belum ada soal kuis untuk materi ini.</p>`;
      return;
    }

    let html = `
      <div class="quiz-header-banner">
        <div>
          <h4 style="font-size:13px; font-weight:700; color:#1e3a8a;">Kuis Formatif Pengetahuan TITL</h4>
          <p style="font-size:12px; color:#3b82f6;">Jawab 5 pertanyaan berikut untuk menguji pemahaman materi ini.</p>
        </div>
        <div class="quiz-score-badge" id="quiz-score-display">Skor: - / 100</div>
      </div>
    `;

    quizList.forEach((q, idx) => {
      html += `
        <div class="quiz-question-card" data-quiz-id="${q.id}">
          <div class="quiz-question-title">Soal ${idx + 1}: ${q.question}</div>
          <div class="quiz-options-list">
            ${q.options.map((opt, optIdx) => `
              <label class="quiz-option-label">
                <input type="radio" name="quiz_${q.id}" value="${optIdx}">
                <span><strong>${String.fromCharCode(65 + optIdx)}.</strong> ${opt}</span>
              </label>
            `).join('')}
          </div>
          <button class="btn-check-quiz" data-quiz-id="${q.id}">Periksa Jawaban</button>
          <div class="quiz-feedback" id="feedback_${q.id}"></div>
        </div>
      `;
    });

    DOM.quizContainer.innerHTML = html;

    // Attach check button handlers
    const checkBtns = DOM.quizContainer.querySelectorAll('.btn-check-quiz');
    checkBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const qId = btn.getAttribute('data-quiz-id');
        const qData = quizList.find(x => x.id === qId);
        if (!qData) return;

        const selected = DOM.quizContainer.querySelector(`input[name="quiz_${qId}"]:checked`);
        const feedbackElem = document.getElementById(`feedback_${qId}`);
        if (!selected) {
          showToast('Silakan pilih salah satu opsi jawaban terlebih dahulu!', 'warning', 2000);
          return;
        }

        const chosenVal = parseInt(selected.value, 10);
        if (chosenVal === qData.correct) {
          feedbackElem.className = 'quiz-feedback correct';
          feedbackElem.innerHTML = `
            <strong>✔ Jawaban Benar!</strong><br>
            ${qData.explanation}
          `;
        } else {
          feedbackElem.className = 'quiz-feedback incorrect';
          feedbackElem.innerHTML = `
            <strong>✖ Kurang Tepat.</strong> Jawaban yang benar adalah <strong>${String.fromCharCode(65 + qData.correct)}</strong>.<br>
            ${qData.explanation}
          `;
        }

        // Update overall score
        updateQuizScore(quizList);
      });
    });
  }

  function updateQuizScore(quizList) {
    let correctCount = 0;
    quizList.forEach(q => {
      const selected = DOM.quizContainer ? DOM.quizContainer.querySelector(`input[name="quiz_${q.id}"]:checked`) : null;
      if (selected && parseInt(selected.value, 10) === q.correct) {
        correctCount++;
      }
    });

    const scoreDisplay = document.getElementById('quiz-score-display');
    if (scoreDisplay) {
      const score = Math.round((correctCount / quizList.length) * 100);
      scoreDisplay.textContent = `Skor: ${score} / 100 (${correctCount}/${quizList.length} Benar)`;
    }
  }

  // ============================================================
  // 12. DIAGNOSTICS & TROUBLESHOOTING ENGINE
  // ============================================================

  function runDiagnostics() {
    const report = {
      valid: true,
      checks: [],
      stats: {
        components: workspaceComponents.length,
        connections: connections.length,
        pneumaticLines: connections.filter(c => c.type === 'pneumatic').length,
        electricalLines: connections.filter(c => c.type === 'electrical').length
      }
    };

    if (workspaceComponents.length === 0) {
      report.valid = false;
      report.checks.push({
        status: 'fail',
        title: 'Area Kerja Kosong',
        desc: 'Belum ada komponen yang disusun di area kerja. Buka menu Materi untuk memuat contoh rangkaian.'
      });
      return report;
    }

    // 1. Cek Sumber Udara Pneumatik
    const hasPneuComps = workspaceComponents.some(c => c.type === 'pneumatic');
    const hasAirSource = workspaceComponents.some(c => c.defId === 'compressor' || c.defId === 'frl-unit');
    if (hasPneuComps) {
      if (hasAirSource) {
        report.checks.push({
          status: 'pass',
          title: 'Pasokan Udara Utama',
          desc: 'Kompresor / FRL tersedia dan menghasilkan tekanan kerja 6.0 bar.'
        });
      } else {
        report.valid = false;
        report.checks.push({
          status: 'fail',
          title: 'Tidak Ada Sumber Udara Bertekanan',
          desc: 'Komponen pneumatik memerlukan Kompresor atau Unit FRL agar dapat bergerak.'
        });
      }
    }

    // 2. Cek Pasokan Listrik DC
    const hasElecComps = workspaceComponents.some(c => c.type === 'electrical');
    const hasDCSource = workspaceComponents.some(c => c.defId === 'dc-source');
    if (hasElecComps) {
      if (hasDCSource) {
        report.checks.push({
          status: 'pass',
          title: 'Catu Daya 24V DC',
          desc: 'Sumber tegangan DC 24V tersedia untuk menyuplai rangkaian kendali listrik.'
        });
      } else {
        report.valid = false;
        report.checks.push({
          status: 'fail',
          title: 'Catu Daya DC Tidak Ditemukan',
          desc: 'Rangkaian memiliki komponen elektrikal namun belum ada catu daya 24V DC.'
        });
      }
    }

    // 3. Cek Port Katup 1 (Pasokan P)
    const valves = workspaceComponents.filter(c => c.category === 'valve');
    valves.forEach(v => {
      const isPort1Conn = isPortConnected(v.id, 1);
      if (isPort1Conn) {
        report.checks.push({
          status: 'pass',
          title: `Katup ${v.label} Pasokan Port 1(P)`,
          desc: `Port masukan 1(P) pada katup ${v.label} telah tersambung.`
        });
      } else {
        report.valid = false;
        report.checks.push({
          status: 'warn',
          title: `Katup ${v.label} Port 1(P) Belum Tersambung`,
          desc: `Port pasokan 1(P) pada katup ${v.label} terbuka. Sambungkan dari FRL atau Kompresor.`
        });
      }
    });

    // 4. Cek Aktuator Silinder
    const cylinders = workspaceComponents.filter(c => c.defId === 'cylinder-single' || c.defId === 'cylinder-double');
    if (cylinders.length > 0) {
      cylinders.forEach(cyl => {
        const isConn = isPortConnected(cyl.id, 1) || (cyl.defId === 'cylinder-double' && isPortConnected(cyl.id, 2));
        if (isConn) {
          report.checks.push({
            status: 'pass',
            title: `Aktuator ${cyl.label}`,
            desc: `Silinder ${cyl.label} telah tersambung ke saluran kerja katup.`
          });
        } else {
          report.valid = false;
          report.checks.push({
            status: 'fail',
            title: `Silinder ${cyl.label} Belum Tersambung`,
            desc: `Port kerja pada silinder ${cyl.label} belum terhubung ke saluran keluar katup.`
          });
        }
      });
    }

    // 5. Cek Kesesuaian Tag Solenoid Elektropneumatik
    const solValves = workspaceComponents.filter(c => c.properties && c.properties.actuationLeft === 'solenoid');
    solValves.forEach(sv => {
      const targetTag = sv.properties.solenoidRef || 'Y1';
      const hasMatchingCoil = workspaceComponents.some(c =>
        c.defId === 'solenoid-coil' && ((c.properties && c.properties.solenoidRef) === targetTag || c.label === targetTag)
      );

      if (hasMatchingCoil) {
        report.checks.push({
          status: 'pass',
          title: `Tautan Solenoid (${targetTag})`,
          desc: `Katup solenoid ${sv.label} memiliki pasangan kumparan koil listrik ${targetTag} yang cocok.`
        });
      } else {
        report.checks.push({
          status: 'warn',
          title: `Kumparan Solenoid (${targetTag}) Tidak Ditemukan`,
          desc: `Katup ${sv.label} membutuhkan kumparan koil listrik dengan tag label "${targetTag}" pada diagram kelistrikan.`
        });
      }
    });

    return report;
  }

  function renderDiagnosticsPanel() {
    if (!DOM.analysisContainer) return;
    const report = runDiagnostics();

    let html = `
      <div class="diag-summary-card">
        <div class="diag-summary-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${report.valid ? '#22c55e' : '#ef4444'}" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          Status Kelayakan Rangkaian: ${report.valid ? '<span style="color:#22c55e">VALID & SIAP SIMULASI</span>' : '<span style="color:#ef4444">PERIKSA KEMBALI SAMBUNGAN</span>'}
        </div>
        <div class="diag-list">
          ${report.checks.map(c => `
            <div class="diag-item ${c.status}">
              <div>
                <strong>${c.title}:</strong> ${c.desc}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    DOM.analysisContainer.innerHTML = html;
  }

  function openDiagnosticsModal() {
    const report = runDiagnostics();
    let bodyHtml = `
      <div style="font-size:13px; line-height:1.6;">
        <div style="margin-bottom:12px; padding:10px 14px; border-radius:6px; background:${report.valid ? '#dcfce7' : '#fee2e2'}; color:${report.valid ? '#166534' : '#991b1b'};">
          <strong>${report.valid ? '✔ Rangkaian Memenuhi Standar Teknik' : '⚠ Ditemukan Masalah pada Rangkaian'}</strong><br>
          Statistik: ${report.stats.components} Komponen, ${report.stats.connections} Sambungan (${report.stats.pneumaticLines} Jalur Udara, ${report.stats.electricalLines} Jalur Listrik).
        </div>
        <div class="diag-list" style="max-height:350px; overflow-y:auto;">
          ${report.checks.map(c => `
            <div class="diag-item ${c.status}" style="margin-bottom:8px;">
              <div>
                <strong>${c.title}</strong><br>
                <span>${c.desc}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    openModal('Hasil Pemeriksaan & Diagnostik Rangkaian', bodyHtml);
  }


  // ============================================================
  // 13. PROPERTY PANEL & CUSTOMIZATION
  // ============================================================

  function showPropertyPanel(compId) {
    const comp = getComponentById(compId);
    if (!comp || !DOM.propertyPanel || !DOM.propertyContent) return;

    // Di mobile / tablet (<= 768px), tutup library & sidebar jika membuka panel properti
    if (window.innerWidth <= 768) {
      if (AppState.libraryOpen) toggleLibrary(false);
      if (AppState.sidebarOpen) toggleSidebar();
    }

    AppState.propertyOpen = true;
    DOM.propertyPanel.classList.add('property-open');
    DOM.propertyPanel.classList.remove('closed');

    const def = getComponentDef(comp.defId);
    const props = comp.properties || {};

    let formFields = `
      <div class="property-group">
        <label class="property-label">Teks / Label Komponen:</label>
        <input type="text" id="prop-comp-label" class="property-input" value="${comp.label || ''}">
      </div>
      <div class="property-group">
        <label class="property-label">Tipe Komponen:</label>
        <input type="text" class="property-input" value="${comp.name}" disabled>
      </div>
      <div class="property-group">
        <label class="property-label">Rotasi Komponen:</label>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" id="btn-rotate-component" class="btn btn-secondary btn-rotate-comp" style="flex:1;" ${AppState.mode === 'simulate' ? 'disabled' : ''}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Putar 90°</span>
          </button>
          <span id="prop-rotation-display" class="badge-rotation">${comp.rotation || 0}°</span>
        </div>
      </div>
    `;

    // Valve Specific Properties
    if (comp.category === 'valve') {
      const actLeft = props.actuationLeft || 'push-button';
      const actRight = props.actuationRight || 'spring';

      formFields += `
        <div class="property-group">
          <label class="property-label">Aktuasi Sisi Kiri (Signal/Manual):</label>
          <select id="prop-act-left" class="property-input">
            <option value="push-button" ${actLeft === 'push-button' ? 'selected' : ''}>Tombol Tekan (Push Button)</option>
            <option value="solenoid" ${actLeft === 'solenoid' ? 'selected' : ''}>Kumparan Solenoid (Elektrik)</option>
            <option value="pilot" ${actLeft === 'pilot' ? 'selected' : ''}>Saluran Pilot Pneumatik</option>
            <option value="roller" ${actLeft === 'roller' ? 'selected' : ''}>Tuas Roller (Mekanik)</option>
            <option value="lever" ${actLeft === 'lever' ? 'selected' : ''}>Tuas Manual (Hand Lever)</option>
          </select>
        </div>
        <div class="property-group">
          <label class="property-label">Aktuasi Sisi Kanan (Pembalik):</label>
          <select id="prop-act-right" class="property-input">
            <option value="spring" ${actRight === 'spring' ? 'selected' : ''}>Pegas Pembalik (Spring Return)</option>
            <option value="solenoid" ${actRight === 'solenoid' ? 'selected' : ''}>Kumparan Solenoid (Double Solenoid)</option>
            <option value="pilot" ${actRight === 'pilot' ? 'selected' : ''}>Saluran Pilot (Double Pilot)</option>
          </select>
        </div>
      `;

      if (actLeft === 'solenoid' || actRight === 'solenoid') {
        formFields += `
          <div class="property-group">
            <label class="property-label">Tag / Tautan Solenoid Listrik:</label>
            <input type="text" id="prop-sol-tag" class="property-input" value="${props.solenoidRef || 'Y1'}">
            <small style="font-size:10.5px; color:#64748b;">Harus sama dengan label kumparan solenoid elektrik</small>
          </div>
        `;
      }

      // ISO 1219-1 Legend Badge for Valves
      formFields += `
        <div class="iso-legend-box">
          <div class="iso-legend-title">Standar ISO 1219-1 Port Katup:</div>
          <div class="iso-legend-item"><span class="iso-legend-dot" style="background:#0284c7;"></span> <strong>1 (P)</strong>: Input Tekanan (Supply)</div>
          <div class="iso-legend-item"><span class="iso-legend-dot" style="background:#16a34a;"></span> <strong>2 (A), 4 (B)</strong>: Output Kerja (Silinder)</div>
          <div class="iso-legend-item"><span class="iso-legend-dot" style="background:#d97706;"></span> <strong>3 (R), 5 (S)</strong>: Pembuangan (Exhaust)</div>
          ${comp.defId === 'valve-5-2-pilot' ? '<div class="iso-legend-item"><span class="iso-legend-dot" style="background:#0284c7;"></span> <strong>14 (Z)</strong>: Sinyal Pilot Pneumatik</div>' : ''}
        </div>
      `;
    }

    // Cylinder Specific Properties
    if (comp.defId === 'cylinder-single' || comp.defId === 'cylinder-double') {
      formFields += `
        <div class="property-group">
          <label class="property-label">Panjang Langkah Piston (Stroke):</label>
          <input type="number" id="prop-stroke" class="property-input" value="${props.strokeLength || 100}">
          <small style="font-size:10.5px; color:#64748b;">Rentang standar: 50 mm - 500 mm</small>
        </div>
      `;
    }

    // Solenoid Coil Specific
    if (comp.defId === 'solenoid-coil') {
      formFields += `
        <div class="property-group">
          <label class="property-label">Tag Referensi Solenoid:</label>
          <input type="text" id="prop-coil-tag" class="property-input" value="${props.solenoidRef || comp.label || 'Y1'}">
        </div>
      `;
    }

    // Relay Specific
    if (comp.defId === 'relay' || comp.defId === 'relay-contact-no' || comp.defId === 'relay-contact-nc') {
      formFields += `
        <div class="property-group">
          <label class="property-label">Tag Referensi Relai:</label>
          <input type="text" id="prop-relay-tag" class="property-input" value="${props.relayRef || props.relayId || 'K1'}">
        </div>
      `;
    }

    // Timer On/Off Delay Specific
    if (comp.defId === 'timer-on-delay' || comp.defId === 'timer-off-delay') {
      const currentDelay = props.timeSec !== undefined ? props.timeSec : 5;
      const currentTag = props.relayRef || props.relayId || comp.label || (comp.defId === 'timer-on-delay' ? 'K2' : 'K3');
      formFields += `
        <div class="property-group">
          <label class="property-label">Waktu Tunda (detik):</label>
          <input type="number" id="prop-time-sec" class="property-input" min="0.1" max="999" step="0.1" value="${currentDelay}">
          <small style="font-size:10.5px; color:#64748b;">Rentang waktu tunda: 0.1 - 999 detik</small>
        </div>
        <div class="property-group">
          <label class="property-label">Tag Relai (Kontak Terkait):</label>
          <input type="text" id="prop-timer-tag" class="property-input" value="${currentTag}">
          <small style="font-size:10.5px; color:#64748b;">Gunakan tag ini pada Kontak NO/NC (misal: ${currentTag})</small>
        </div>
      `;
    }

    // Relay Counter Specific
    if (comp.defId === 'counter') {
      const currentPreset = props.presetCount !== undefined ? props.presetCount : 5;
      const currentTag = props.relayRef || props.relayId || comp.label || 'K4';
      formFields += `
        <div class="property-group">
          <label class="property-label">Nilai Preset (Jumlah Hitungan):</label>
          <input type="number" id="prop-preset-count" class="property-input" min="1" max="999" step="1" value="${currentPreset}">
          <small style="font-size:10.5px; color:#64748b;">Rentang preset: 1 - 999 hitungan pulsa</small>
        </div>
        <div class="property-group">
          <label class="property-label">Tag Relai (Kontak Terkait):</label>
          <input type="text" id="prop-counter-tag" class="property-input" value="${currentTag}">
          <small style="font-size:10.5px; color:#64748b;">Gunakan tag ini pada Kontak NO/NC (misal: ${currentTag})</small>
        </div>
      `;
    }

    // Limit Switch Specific
    if (comp.defId === 'limit-switch') {
      const swRef = props.limitSwitchRef || '1S2';
      formFields += `
        <div class="property-group">
          <label class="property-label">Posisi Trigger Limit Switch:</label>
          <select id="prop-limit-ref" class="property-input">
            <option value="1S1" ${swRef === '1S1' ? 'selected' : ''}>1S1 (Posisi Awal / Silinder 0% Mundur)</option>
            <option value="1S2" ${swRef === '1S2' ? 'selected' : ''}>1S2 (Posisi Akhir / Silinder 100% Maju)</option>
          </select>
        </div>
      `;
    }

    DOM.propertyContent.innerHTML = `
      <form id="property-form">
        ${formFields}
        <button type="submit" class="btn btn-primary" style="width:100%; margin-top:14px;">Simpan Perubahan</button>
      </form>
    `;

    // Form submit & change listener
    const form = document.getElementById('property-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        savePropertyChanges(comp.id);
      });
      form.addEventListener('change', () => {
        savePropertyChanges(comp.id);
      });
    }

    // Rotate component button listener
    const btnRotate = document.getElementById('btn-rotate-component');
    if (btnRotate) {
      btnRotate.addEventListener('click', (e) => {
        e.preventDefault();
        rotateComponent(comp.id, 90);
      });
    }
  }

  function hidePropertyPanel() {
    AppState.propertyOpen = false;
    if (DOM.propertyPanel) {
      DOM.propertyPanel.classList.remove('property-open');
      DOM.propertyPanel.classList.add('closed');
    }
  }

  function savePropertyChanges(compId) {
    const comp = getComponentById(compId);
    if (!comp) return;

    const beforeSnap = JSON.stringify(comp);

    const labelInput = document.getElementById('prop-comp-label');
    if (labelInput && labelInput.value.trim()) {
      comp.label = labelInput.value.trim();
    }

    const actLeft = document.getElementById('prop-act-left');
    if (actLeft) {
      comp.properties.actuationLeft = actLeft.value;
    }
    const actRight = document.getElementById('prop-act-right');
    if (actRight) {
      comp.properties.actuationRight = actRight.value;
    }
    const solTag = document.getElementById('prop-sol-tag');
    if (solTag && solTag.value.trim()) {
      comp.properties.solenoidRef = solTag.value.trim();
    }
    const coilTag = document.getElementById('prop-coil-tag');
    if (coilTag && coilTag.value.trim()) {
      comp.properties.solenoidRef = coilTag.value.trim();
      comp.label = coilTag.value.trim();
    }
    const relayTag = document.getElementById('prop-relay-tag');
    if (relayTag && relayTag.value.trim()) {
      comp.properties.relayRef = relayTag.value.trim();
      comp.properties.relayId = relayTag.value.trim();
    }
    const timeSecInput = document.getElementById('prop-time-sec');
    if (timeSecInput) {
      const val = parseFloat(timeSecInput.value);
      if (isNaN(val) || val < 0.1 || val > 999) {
        showToast('Waktu tunda harus antara 0.1 hingga 999 detik!', 'error', 2500);
        timeSecInput.value = comp.properties.timeSec !== undefined ? comp.properties.timeSec : 5;
        return;
      }
      comp.properties.timeSec = val;
    }
    const timerTagInput = document.getElementById('prop-timer-tag');
    if (timerTagInput && timerTagInput.value.trim()) {
      const newTag = timerTagInput.value.trim();
      comp.properties.relayRef = newTag;
      comp.properties.relayId = newTag;
      comp.label = newTag;
    }
    const presetCountInput = document.getElementById('prop-preset-count');
    if (presetCountInput) {
      const val = parseInt(presetCountInput.value, 10);
      if (isNaN(val) || val < 1 || val > 999) {
        showToast('Nilai preset hitungan harus antara 1 hingga 999!', 'error', 2500);
        presetCountInput.value = comp.properties.presetCount !== undefined ? comp.properties.presetCount : 5;
        return;
      }
      comp.properties.presetCount = val;
    }
    const counterTagInput = document.getElementById('prop-counter-tag');
    if (counterTagInput && counterTagInput.value.trim()) {
      const newTag = counterTagInput.value.trim();
      comp.properties.relayRef = newTag;
      comp.properties.relayId = newTag;
      comp.label = newTag;
    }
    const limitRef = document.getElementById('prop-limit-ref');
    if (limitRef) {
      comp.properties.limitSwitchRef = limitRef.value;
      comp.label = limitRef.value;
    }

    // Re-render component in workspace
    renderComponent(comp);

    const afterSnap = JSON.stringify(comp);
    if (beforeSnap !== afterSnap && !isBatchAction && !isRestoringState) {
      commitState();
    }

    showToast('Properti komponen berhasil diperbarui', 'success', 1500);
  }

  // ============================================================
  // 14. LIBRARY PANEL UI
  // ============================================================

  function renderFilterButtons() {
    if (!DOM.libraryFilter) return;
    DOM.libraryFilter.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat.id === AppState.activeCategory ? 'active' : ''}" data-category="${cat.id}">
        ${cat.name}
      </button>
    `).join('');

    const btns = DOM.libraryFilter.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.activeCategory = btn.getAttribute('data-category');
        renderFilterButtons();
        renderLibrary();
      });
    });
  }

  function renderLibrary() {
    if (!DOM.libraryComponents) return;
    const query = AppState.searchQuery.toLowerCase();

    const filtered = componentLibrary.filter(c => {
      const matchCat = AppState.activeCategory === 'all' || c.category === AppState.activeCategory;
      const matchQ = c.name.toLowerCase().includes(query) || c.description.toLowerCase().includes(query);
      return matchCat && matchQ;
    });

    if (filtered.length === 0) {
      DOM.libraryComponents.innerHTML = `<div class="library-empty-msg">Tidak ada komponen yang cocok dengan pencarian</div>`;
      return;
    }

    DOM.libraryComponents.innerHTML = filtered.map(c => {
      const defW = c.width || 100;
      const defH = c.height || 60;
      const padX = c.category === 'valve' ? 18 : 12;
      const padY = 8;
      const vb = `${-defW / 2 - padX} ${-defH / 2 - padY} ${defW + padX * 2} ${defH + padY * 2}`;
      const tooltip = c.category === 'valve'
        ? `${c.name}: ${c.description} | Standar ISO 1219-1: 1=Input Tekanan (P) · 2/4=Output Kerja (A/B) · 3/5=Pembuangan (R/S)`
        : `${c.name}: ${c.description}`;

      return `
        <div class="library-component-item" data-def-id="${c.id}" title="${tooltip}">
          <div class="library-item-preview">
            <svg width="60" height="45" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">
              ${renderComponentSymbol({ defId: c.id, width: c.width, height: c.height, properties: c.defaultProperties || {} })}
            </svg>
          </div>
          <div class="library-item-info">
            <span class="library-item-name">${c.name}</span>
            <span class="library-item-desc">${c.description}</span>
          </div>
        </div>
      `;
    }).join('');

    // Attach click to add component
    const items = DOM.libraryComponents.querySelectorAll('.library-component-item');
    items.forEach(item => {
      item.addEventListener('click', () => {
        const defId = item.getAttribute('data-def-id');
        // Place in center of workspace
        const rect = DOM.workspaceContainer ? DOM.workspaceContainer.getBoundingClientRect() : { width: 800, height: 600 };
        const center = screenToSVGCoordinates(rect.width / 2 + (Math.random() * 40 - 20), rect.height / 2 + (Math.random() * 40 - 20));
        addComponent(defId, center.x, center.y);
        showToast(`Komponen ditambahkan ke area kerja`, 'info', 1200);
      });
    });
  }

  // ============================================================
  // 15. MODE MANAGEMENT (EDIT vs SIMULASI)
  // ============================================================

  function setMode(mode) {
    AppState.mode = mode;

    if (mode === 'simulate') {
      document.body.classList.add('mode-simulate');
      document.body.classList.add('simulating');

      if (DOM.modeLabel) DOM.modeLabel.textContent = 'Mode Simulasi';
      if (DOM.btnMode) {
        DOM.btnMode.classList.add('mode-simulate');
        DOM.btnMode.classList.add('sim-active');
      }
      if (DOM.modeIcon) {
        DOM.modeIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>`;
      }

      // Show Simulation Control Bar
      if (DOM.simulationControlBar) {
        DOM.simulationControlBar.style.display = 'flex';
      }

      cancelConnectionDrawing();
      deselectComponent();
      deselectConnection();
      deselectJunction();
      toggleLibrary(false);
      if (DOM.rotateSelected) DOM.rotateSelected.disabled = true;

      // Start Simulation Engine
      SimEngine.reset();
      SimEngine.start();
      SimEngine.updateSimulationControlsUI();

      showToast('Mode Simulasi Aktif: Tekan tombol pada katup atau saklar untuk menguji rangkaian!', 'success', 3500);

    } else {
      document.body.classList.remove('mode-simulate');
      document.body.classList.remove('simulating');

      if (DOM.modeLabel) DOM.modeLabel.textContent = 'Mode Edit';
      if (DOM.btnMode) {
        DOM.btnMode.classList.remove('mode-simulate');
        DOM.btnMode.classList.remove('sim-active');
      }
      if (DOM.modeIcon) {
        DOM.modeIcon.innerHTML = `
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        `;
      }

      // Hide Simulation Control Bar
      if (DOM.simulationControlBar) {
        DOM.simulationControlBar.style.display = 'none';
      }

      // Stop Simulation Engine
      SimEngine.stop();
      SimEngine.reset();
      if (DOM.rotateSelected) DOM.rotateSelected.disabled = !AppState.selectedComponentId;

      showToast('Mode Edit Aktif: Komponen dapat digeser, disambung, dan diatur.', 'info', 1800);
    }
    updateUndoRedoButtons();
  }

  // ============================================================
  // 16. SIDEBAR & NAVIGATION
  // ============================================================

  function toggleSidebar() {
    AppState.sidebarOpen = !AppState.sidebarOpen;
    if (DOM.sidebar) {
      if (AppState.sidebarOpen) {
        DOM.sidebar.classList.add('sidebar-open');
        // Di mobile/tablet (<= 768px), tutup library & property panel saat sidebar dibuka
        if (window.innerWidth <= 768) {
          if (AppState.libraryOpen) toggleLibrary(false);
          hidePropertyPanel();
        }
      } else {
        DOM.sidebar.classList.remove('sidebar-open');
      }
    }
    setTimeout(updateViewBox, 250);
  }

  function toggleLibrary(forceOpen = null) {
    if (forceOpen !== null) AppState.libraryOpen = forceOpen;
    else AppState.libraryOpen = !AppState.libraryOpen;

    if (DOM.libraryPanel) {
      if (AppState.libraryOpen) {
        DOM.libraryPanel.classList.add('library-open');
        DOM.libraryPanel.classList.remove('closed');
        document.body.classList.add('library-active');

        // Di mobile/tablet (<= 768px), tutup sidebar dan sembunyikan property panel saat library dibuka
        if (window.innerWidth <= 768) {
          if (AppState.sidebarOpen) {
            AppState.sidebarOpen = false;
            if (DOM.sidebar) DOM.sidebar.classList.remove('sidebar-open');
          }
          hidePropertyPanel();
        }
      } else {
        DOM.libraryPanel.classList.remove('library-open');
        DOM.libraryPanel.classList.add('closed');
        document.body.classList.remove('library-active');
      }
    }
  }

  // ============================================================
  // 17. PROJECT PERSISTENCE (FILE DOWNLOAD/UPLOAD & LOCAL STORAGE)
  // ============================================================

  function generateProjectFilename() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `pneulab-proyek-${year}${month}${day}-${hours}${minutes}.json`;
  }

  function createProjectData() {
    return {
      format: 'electropneusim-project',
      version: 1,
      savedAt: new Date().toISOString(),
      appName: 'Pneulab',
      data: {
        components: JSON.parse(JSON.stringify(workspaceComponents)),
        connections: JSON.parse(JSON.stringify(connections)),
        junctions: JSON.parse(JSON.stringify(junctions)),
        nextComponentNumber: AppState.nextComponentNumber || 1
      }
    };
  }

  function migrateProjectData(projectObj) {
    if (!projectObj) return null;

    // Format legacy tanpa pembungkus 'format' (misal backup lama dari localStorage)
    if (!projectObj.format && Array.isArray(projectObj.components)) {
      return {
        format: 'electropneusim-project',
        version: 1,
        savedAt: projectObj.timestamp || new Date().toISOString(),
        appName: 'Pneulab',
        data: {
          components: projectObj.components || [],
          connections: projectObj.connections || [],
          junctions: projectObj.junctions || [],
          nextComponentNumber: projectObj.nextComponentNumber || 1
        }
      };
    }

    // Format versi 1 (standar saat ini)
    if (projectObj.format === 'electropneusim-project') {
      if (projectObj.version === 1) {
        return projectObj;
      }
      // Tempat penanganan migrasi skema untuk versi masa mendatang
      if (projectObj.version > 1) {
        return projectObj;
      }
    }

    return projectObj;
  }

  function validateProjectFile(parsed) {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        valid: false,
        error: 'Format file tidak valid: berkas bukan merupakan objek JSON proyek yang sah.'
      };
    }

    // Tangani kemungkinan file lama (legacy)
    let projectObj = parsed;
    if (!projectObj.format && Array.isArray(projectObj.components)) {
      projectObj = migrateProjectData(projectObj);
    }

    if (projectObj.format !== 'electropneusim-project') {
      return {
        valid: false,
        error: 'Format file tidak dikenali. File proyek harus memiliki atribut format "electropneusim-project".'
      };
    }

    if (typeof projectObj.version !== 'number' || projectObj.version < 1) {
      return {
        valid: false,
        error: `Versi format proyek (${projectObj.version}) tidak didukung.`
      };
    }

    if (projectObj.version > 1) {
      projectObj = migrateProjectData(projectObj);
    }

    const data = projectObj.data;
    if (!data || typeof data !== 'object') {
      return {
        valid: false,
        error: 'Struktur data proyek tidak valid: objek "data" tidak ditemukan.'
      };
    }

    if (!Array.isArray(data.components)) {
      return {
        valid: false,
        error: 'Data proyek tidak valid: daftar komponen ("components") harus berupa array.'
      };
    }

    if (data.connections && !Array.isArray(data.connections)) {
      return {
        valid: false,
        error: 'Data proyek tidak valid: daftar sambungan ("connections") harus berupa array.'
      };
    }

    if (data.junctions && !Array.isArray(data.junctions)) {
      return {
        valid: false,
        error: 'Data proyek tidak valid: daftar titik cabang ("junctions") harus berupa array.'
      };
    }

    // Bangun pemetaan komponen dan nomor port
    const compMap = new Map();
    for (let i = 0; i < data.components.length; i++) {
      const c = data.components[i];
      if (!c || typeof c !== 'object' || !c.id || !c.defId) {
        return {
          valid: false,
          error: `Komponen pada indeks ${i} tidak valid (id atau defId tidak ada).`
        };
      }
      if (typeof c.x !== 'number' || typeof c.y !== 'number' || isNaN(c.x) || isNaN(c.y)) {
        return {
          valid: false,
          error: `Koordinat posisi komponen "${c.label || c.id}" tidak valid.`
        };
      }

      const portSet = new Set();
      if (Array.isArray(c.ports)) {
        c.ports.forEach(p => {
          if (p && typeof p.portNumber === 'number') {
            portSet.add(p.portNumber);
          }
        });
      }
      const def = typeof getComponentDef === 'function' ? getComponentDef(c.defId) : null;
      if (def && Array.isArray(def.ports)) {
        def.ports.forEach(p => {
          if (p && typeof p.portNumber === 'number') {
            portSet.add(p.portNumber);
          }
        });
      }

      compMap.set(c.id, { comp: c, ports: portSet });
    }

    // Bangun set titik percabangan (junction)
    const junctionSet = new Set();
    const juncList = data.junctions || [];
    for (let i = 0; i < juncList.length; i++) {
      const j = juncList[i];
      if (j && j.id) {
        junctionSet.add(j.id);
      }
    }

    // Validasi integritas sambungan kabel/pipa
    const connList = data.connections || [];
    for (let i = 0; i < connList.length; i++) {
      const conn = connList[i];
      if (!conn || typeof conn !== 'object') {
        return {
          valid: false,
          error: `Sambungan pada indeks ${i} tidak valid.`
        };
      }

      // Validasi Port / Junction Sumber
      if (conn.sourceType === 'junction') {
        if (!conn.sourceJunctionId || !junctionSet.has(conn.sourceJunctionId)) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke titik cabang (junction) "${conn.sourceJunctionId}" yang tidak ditemukan.`
          };
        }
      } else {
        if (!conn.sourceCompId || !compMap.has(conn.sourceCompId)) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke komponen sumber "${conn.sourceCompId}" yang tidak ditemukan dalam proyek.`
          };
        }
        const sComp = compMap.get(conn.sourceCompId);
        const sPort = Number(conn.sourcePortNum);
        if (isNaN(sPort) || (sComp.ports.size > 0 && !sComp.ports.has(sPort))) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke port ${conn.sourcePortNum} pada komponen "${sComp.comp.label || conn.sourceCompId}" yang tidak ada.`
          };
        }
      }

      // Validasi Port / Junction Tujuan
      if (conn.targetType === 'junction') {
        if (!conn.targetJunctionId || !junctionSet.has(conn.targetJunctionId)) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke titik cabang (junction) "${conn.targetJunctionId}" yang tidak ditemukan.`
          };
        }
      } else {
        if (!conn.targetCompId || !compMap.has(conn.targetCompId)) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke komponen tujuan "${conn.targetCompId}" yang tidak ditemukan dalam proyek.`
          };
        }
        const tComp = compMap.get(conn.targetCompId);
        const tPort = Number(conn.targetPortNum);
        if (isNaN(tPort) || (tComp.ports.size > 0 && !tComp.ports.has(tPort))) {
          return {
            valid: false,
            error: `Kabel sambungan mengacu ke port ${conn.targetPortNum} pada komponen "${tComp.comp.label || conn.targetCompId}" yang tidak ada.`
          };
        }
      }
    }

    return {
      valid: true,
      project: projectObj
    };
  }

  function applyProjectData(data) {
    const wasBatch = isBatchAction;
    isBatchAction = true;
    try {
      clearAllComponents(true);

      if (Array.isArray(data.components)) {
        data.components.forEach(c => {
          const def = typeof getComponentDef === 'function' ? getComponentDef(c.defId) : null;
          if (def) {
            if (!c.width) c.width = def.width;
            if (!c.height) c.height = def.height;
            if (!c.name) c.name = def.name;
            if (!c.category) c.category = def.category;
            if (!c.type) c.type = def.type;
            if (!c.ports) c.ports = JSON.parse(JSON.stringify(def.ports));
          }
          if (typeof c.rotation !== 'number') c.rotation = 0;
          else c.rotation = (((c.rotation % 360) + 360) % 360);
          workspaceComponents.push(c);
          renderComponent(c);
        });
      }

      if (Array.isArray(data.junctions)) {
        data.junctions.forEach(j => {
          junctions.push(j);
          renderJunction(j);
        });
      }

      if (Array.isArray(data.connections)) {
        data.connections.forEach(conn => {
          connections.push(conn);
          renderConnection(conn);
        });
      }

      if (typeof data.nextComponentNumber === 'number') {
        AppState.nextComponentNumber = data.nextComponentNumber;
      }

      // Sinkronkan status visual connected pada seluruh port DOM
      workspaceComponents.forEach(c => {
        if (Array.isArray(c.ports)) {
          c.ports.forEach(p => {
            const pEl = document.getElementById(`port-${c.id}-${p.portNumber}`);
            if (pEl) {
              if (isPortConnected(c.id, p.portNumber)) {
                pEl.classList.add('connected');
              } else {
                pEl.classList.remove('connected');
              }
            }
          });
        }
      });

      updateComponentCount();
      updateConnectionCount();
      updateEmptyMessage();
      zoomToFit();
      if (typeof updateNeutralWires === 'function') updateNeutralWires();
      if (typeof deselectComponent === 'function') deselectComponent();
      if (typeof deselectConnection === 'function') deselectConnection();
      if (typeof deselectJunction === 'function') deselectJunction();
      if (typeof hidePropertyPanel === 'function') hidePropertyPanel();
    } finally {
      isBatchAction = wasBatch;
    }

    // Pemuatan proyek dicatat sebagai 1 langkah commit riwayat Undo
    if (!isBatchAction && !isRestoringState && typeof commitState === 'function') {
      commitState();
    }
  }

  function saveProjectToFile() {
    try {
      const project = createProjectData();
      const jsonString = JSON.stringify(project, null, 2);
      const filename = generateProjectFilename();
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

      // Simpan juga salinan cadangan ke localStorage
      try {
        localStorage.setItem('pneulab_save', JSON.stringify(project.data));
        localStorage.setItem('electropneusim_save', JSON.stringify(project.data));
      } catch (_) {}

      // Mekanisme unduh standar via Blob dan elemen <a download>
      const a = document.createElement('a');
      if ('download' in a) {
        const url = URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) a.parentNode.removeChild(a);
          URL.revokeObjectURL(url);
        }, 500);
        showToast('Proyek disimpan ke perangkat', 'success', 2500);
        return true;
      }

      // Fallback 1: Web Share API (Safari iOS / perangkat mobile modern)
      if (navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: 'application/json' })] })) {
        const file = new File([blob], filename, { type: 'application/json' });
        navigator.share({
          title: filename,
          text: 'File Proyek Pneulab',
          files: [file]
        }).then(() => {
          showToast('Proyek disimpan ke perangkat', 'success', 2500);
        }).catch(err => {
          if (err.name !== 'AbortError') {
            showToast('Gagal membagikan file: ' + err.message, 'error', 3000);
          }
        });
        return true;
      }

      // Fallback 2: Buka sebagai Data URI di tab/jendela baru
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUri = e.target.result;
        const opened = window.open(dataUri, '_blank');
        if (!opened) {
          window.location.href = dataUri;
        }
        showToast('Proyek disimpan ke perangkat', 'success', 2500);
      };
      reader.readAsDataURL(blob);
      return true;
    } catch (e) {
      showToast('Gagal menyimpan file proyek: ' + e.message, 'error', 3000);
      return false;
    }
  }

  function openProjectFromFile() {
    if (DOM.fileInputProject) {
      DOM.fileInputProject.click();
    }
  }

  function handleProjectFileInput(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const text = e.target.result;
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (parseErr) {
          showToast('File tidak valid: bukan format JSON yang benar.', 'error', 3500);
          return;
        }

        const validation = validateProjectFile(parsed);
        if (!validation.valid) {
          showToast(validation.error, 'error', 4000);
          return;
        }

        applyProjectData(validation.project.data);
        showToast('Proyek dibuka', 'success', 2500);
      } catch (err) {
        showToast('Gagal membaca file proyek: ' + err.message, 'error', 3500);
      } finally {
        if (DOM.fileInputProject) DOM.fileInputProject.value = '';
      }
    };
    reader.onerror = function() {
      showToast('Gagal membaca berkas dari perangkat.', 'error', 3000);
      if (DOM.fileInputProject) DOM.fileInputProject.value = '';
    };
    reader.readAsText(file);
  }

  function saveToLocalStorage() {
    try {
      const project = createProjectData();
      localStorage.setItem('pneulab_save', JSON.stringify(project.data));
      localStorage.setItem('electropneusim_save', JSON.stringify(project.data));
      showToast('Rangkaian berhasil disimpan ke browser!', 'success', 2500);
    } catch (e) {
      showToast('Gagal menyimpan ke browser: ' + e.message, 'error', 3000);
    }
  }

  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem('pneulab_save') || localStorage.getItem('electropneusim_save');
      if (!raw) {
        showToast('Tidak ada data rangkaian yang tersimpan sebelumnya di browser.', 'warning', 2500);
        return;
      }
      const parsed = JSON.parse(raw);
      const validation = validateProjectFile(parsed);
      if (!validation.valid) {
        showToast('Data penyimpanan browser tidak valid: ' + validation.error, 'error', 3000);
        return;
      }
      applyProjectData(validation.project.data);
      showToast('Rangkaian tersimpan di browser berhasil dimuat!', 'success', 2500);
    } catch (e) {
      showToast('Gagal memuat dari browser: ' + e.message, 'error', 3000);
    }
  }

  function saveProject() {
    return saveProjectToFile();
  }

  function loadProject(input) {
    if (input) {
      if (typeof input === 'string') {
        try {
          const parsed = JSON.parse(input);
          const validation = validateProjectFile(parsed);
          if (validation.valid) {
            applyProjectData(validation.project.data);
            showToast('Proyek dibuka', 'success', 2500);
            return true;
          } else {
            showToast(validation.error, 'error', 3500);
            return false;
          }
        } catch (e) {
          showToast('JSON tidak valid: ' + e.message, 'error', 3000);
          return false;
        }
      } else if (typeof input === 'object') {
        const validation = validateProjectFile(input);
        if (validation.valid) {
          applyProjectData(validation.project.data);
          showToast('Proyek dibuka', 'success', 2500);
          return true;
        } else {
          showToast(validation.error, 'error', 3500);
          return false;
        }
      }
    }
    // Jika dipanggil tanpa argumen dari kode, gunakan fallback localStorage
    return loadFromLocalStorage();
  }

  // ============================================================
  // 18. MODAL DIALOGS
  // ============================================================

  function openModal(title, bodyHTML) {
    if (!DOM.modalOverlay) return;
    if (DOM.modalTitle) DOM.modalTitle.textContent = title;
    if (DOM.modalBody) DOM.modalBody.innerHTML = bodyHTML;
    DOM.modalOverlay.style.display = 'flex';
  }

  function closeModal() {
    if (DOM.modalOverlay) DOM.modalOverlay.style.display = 'none';
  }

  function showHelpModal() {
    const html = `
      <div style="font-size:13px; line-height:1.7; color:#334155;">
        <h4 style="color:#0f172a; margin-bottom:6px;">Panduan Singkat Penggunaan:</h4>
        <ol style="margin-left:20px; margin-bottom:12px;">
          <li><strong>Pilih Materi:</strong> Klik salah satu dari 3 materi di bilah kiri untuk mempelajari teori, langkah kerja, kuis interaktif, dan memuat contoh rangkaian standar.</li>
          <li><strong>Menyambung Port (Wiring/Tubing):</strong> Klik port sumber (lingkaran pada komponen), lalu klik port tujuan. Jalur akan otomatis dibuat mengikuti standar ortogonal 90°.</li>
          <li><strong>Percabangan Jalur:</strong> Dalam mode penarikan jalur, klik pada garis pipa/kabel yang sudah ada untuk membuat titik percabangan (T-Junction).</li>
          <li><strong>Beralih Mode:</strong> Klik tombol <strong>Mode Edit / Mode Simulasi</strong> di kanan atas. Pada Mode Simulasi, klik atau tahan tombol untuk mengamati pergerakan katup dan piston!</li>
          <li><strong>Bilah Kontrol Simulasi:</strong> Gunakan panel di bagian bawah untuk menekan, mengunci (latch), atau melepaskan tombol pengoperasian dengan mudah.</li>
        </ol>
        <h4 style="color:#0f172a; margin-bottom:4px;">Pintasan Papan Ketik (Shortcuts):</h4>
        <p style="font-size:12px;"><strong>Delete / Backspace:</strong> Hapus komponen atau garis terpilih | <strong>Esc:</strong> Batalkan penyambungan | <strong>+ / -:</strong> Zoom In / Out | <strong>0:</strong> Sesuaikan tampilan.</p>
      </div>
    `;
    openModal('Petunjuk Penggunaan Pneulab', html);
  }

  function showAboutModal() {
    const html = `
      <div style="font-size:13px; line-height:1.7; color:#334155; text-align:center;">
        <div>
          <div class="modal-logo-badge">
            <img src="assets/logo-pneulab-full.png" alt="Logo Pneulab" class="modal-logo-img">
          </div>
        </div>
        <h3 style="color:#0f172a; font-size:18px; margin-bottom:4px; font-weight:700;">Pneulab</h3>
        <p style="font-weight:600; color:#2563eb; margin-bottom:8px;">Media Pembelajaran Simulasi Sistem Kendali Elektropneumatik</p>
        <p>Dikembangkan khusus untuk mendukung kegiatan pembelajaran praktikum siswa <strong>Kelas XI Teknik Instalasi Tenaga Listrik (TITL) SMK Negeri 1 Padang</strong>.</p>
        <p style="font-size:12px; color:#64748b; margin-top:10px;">Standar Simbol Teknik: ISO 1219-1 (Fluid Power Systems) & IEC 60617 (Electrical Schematics).</p>
      </div>
    `;
    openModal('Tentang Aplikasi Pneulab', html);
  }

  // ============================================================
  // 19. EVENT LISTENERS SETUP
  // ============================================================

  function setupEventListeners() {
    // Header actions
    if (DOM.sidebarToggle) DOM.sidebarToggle.addEventListener('click', toggleSidebar);
    if (DOM.sidebarClose) DOM.sidebarClose.addEventListener('click', toggleSidebar);
    if (DOM.btnMode) {
      DOM.btnMode.addEventListener('click', () => {
        setMode(AppState.mode === 'edit' ? 'simulate' : 'edit');
      });
    }
    if (DOM.btnDiagnostics) DOM.btnDiagnostics.addEventListener('click', openDiagnosticsModal);
    if (DOM.btnSave) DOM.btnSave.addEventListener('click', saveProjectToFile);
    if (DOM.btnLoad) DOM.btnLoad.addEventListener('click', openProjectFromFile);
    if (DOM.fileInputProject) DOM.fileInputProject.addEventListener('change', handleProjectFileInput);
    if (DOM.btnSaveBrowser) DOM.btnSaveBrowser.addEventListener('click', saveToLocalStorage);
    if (DOM.btnLoadBrowser) DOM.btnLoadBrowser.addEventListener('click', loadFromLocalStorage);
    if (DOM.btnHome) DOM.btnHome.addEventListener('click', showAboutModal);
    if (DOM.btnHelp) DOM.btnHelp.addEventListener('click', showHelpModal);
    if (DOM.btnReset) DOM.btnReset.addEventListener('click', () => clearAllComponents(false));

    // Material Nav Items
    if (DOM.materialNav) {
      const items = DOM.materialNav.querySelectorAll('.material-item');
      items.forEach(item => {
        item.addEventListener('click', () => {
          const matId = item.getAttribute('data-material');
          selectMaterial(matId);
          if (window.innerWidth <= 768 && AppState.sidebarOpen) {
            toggleSidebar();
          }
        });
      });
    }

    if (DOM.btnLoadPreset) {
      DOM.btnLoadPreset.addEventListener('click', () => {
        if (AppState.activeMaterial) {
          loadPresetCircuit(AppState.activeMaterial);
          showWorkspaceView();
          showToast('Rangkaian contoh berhasil dimuat ke Area Kerja', 'success', 2500);
        }
      });
    }

    if (DOM.btnToWorkspace) {
      DOM.btnToWorkspace.addEventListener('click', () => {
        showWorkspaceView();
        showToast('Beralih ke Area Kerja', 'info', 1500);
      });
    }

    if (DOM.btnShowMaterial) {
      DOM.btnShowMaterial.addEventListener('click', () => {
        if (AppState.activeMaterial) {
          showMaterialView();
        } else {
          selectMaterial('direct');
        }
      });
    }

    if (DOM.headerMaterialBadge) {
      DOM.headerMaterialBadge.style.cursor = 'pointer';
      DOM.headerMaterialBadge.addEventListener('click', () => {
        if (AppState.activeMaterial) {
          showMaterialView();
        } else {
          selectMaterial('direct');
        }
      });
    }

    if (DOM.closeMaterialInfo) {
      DOM.closeMaterialInfo.addEventListener('click', closeMaterialInfo);
    }

    // Material Tabs
    const tabBtns = document.querySelectorAll('.material-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchMaterialTab(tab);
      });
    });

    // Quick preset buttons on empty callout
    const btnQ1 = document.getElementById('btn-quick-preset-1');
    if (btnQ1) btnQ1.addEventListener('click', () => { selectMaterial('direct'); loadPresetCircuit('direct'); showWorkspaceView(); });
    const btnQ2 = document.getElementById('btn-quick-preset-2');
    if (btnQ2) btnQ2.addEventListener('click', () => { selectMaterial('indirect'); loadPresetCircuit('indirect'); showWorkspaceView(); });
    const btnQ3 = document.getElementById('btn-quick-preset-3');
    if (btnQ3) btnQ3.addEventListener('click', () => { selectMaterial('electropneumatic'); loadPresetCircuit('electropneumatic'); showWorkspaceView(); });

    // Library toggle & close
    const libToggleBtn = document.getElementById('btn-library-toggle');
    if (libToggleBtn) libToggleBtn.addEventListener('click', () => {
      toggleLibrary(true);
      if (window.innerWidth <= 768 && AppState.sidebarOpen) toggleSidebar();
    });
    const btnOpenLib = document.getElementById('btn-open-library');
    if (btnOpenLib) btnOpenLib.addEventListener('click', () => toggleLibrary(true));
    if (DOM.libraryClose) DOM.libraryClose.addEventListener('click', () => toggleLibrary(false));

    // Library search
    if (DOM.librarySearch) {
      DOM.librarySearch.addEventListener('input', (e) => {
        AppState.searchQuery = e.target.value.trim();
        renderLibrary();
      });
    }

    // Property panel close
    if (DOM.propertyClose) DOM.propertyClose.addEventListener('click', hidePropertyPanel);

    // Toolbar buttons
    if (DOM.btnUndo) DOM.btnUndo.addEventListener('click', undo);
    if (DOM.btnRedo) DOM.btnRedo.addEventListener('click', redo);
    if (DOM.zoomIn) DOM.zoomIn.addEventListener('click', zoomIn);
    if (DOM.zoomOut) DOM.zoomOut.addEventListener('click', zoomOut);
    if (DOM.zoomFit) DOM.zoomFit.addEventListener('click', zoomToFit);
    if (DOM.rotateSelected) {
      DOM.rotateSelected.addEventListener('click', () => {
        if (AppState.selectedComponentId) {
          rotateComponent(AppState.selectedComponentId, 90);
        }
      });
    }
    if (DOM.deleteSelected) {
      DOM.deleteSelected.addEventListener('click', () => {
        if (AppState.selectedComponentId) removeComponent(AppState.selectedComponentId);
        else if (AppState.selectedConnectionId) removeConnection(AppState.selectedConnectionId);
        else if (AppState.selectedJunctionId) removeJunction(AppState.selectedJunctionId);
      });
    }
    if (DOM.deleteAll) DOM.deleteAll.addEventListener('click', () => clearAllComponents(false));

    // Cancel connection drawing button
    if (DOM.btnCancelConnection) DOM.btnCancelConnection.addEventListener('click', cancelConnectionDrawing);

    // Simulation bar controls
    if (DOM.btnSimPlayPause) DOM.btnSimPlayPause.addEventListener('click', () => SimEngine.toggle());
    if (DOM.btnSimReleaseAll) DOM.btnSimReleaseAll.addEventListener('click', () => SimEngine.releaseAllButtons());

    const speedBtns = document.querySelectorAll('.btn-speed');
    speedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        SimEngine.setSpeed(btn.getAttribute('data-speed'));
      });
    });

    // Modal Close
    if (DOM.modalClose) DOM.modalClose.addEventListener('click', closeModal);
    if (DOM.modalOverlay) {
      DOM.modalOverlay.addEventListener('click', (e) => {
        if (e.target === DOM.modalOverlay) closeModal();
      });
    }

    // Guide & About buttons in sidebar
    const btnGuide = document.getElementById('btn-guide');
    if (btnGuide) btnGuide.addEventListener('click', () => {
      showHelpModal();
      if (window.innerWidth <= 768 && AppState.sidebarOpen) toggleSidebar();
    });
    const btnAbout = document.getElementById('btn-about');
    if (btnAbout) btnAbout.addEventListener('click', () => {
      showAboutModal();
      if (window.innerWidth <= 768 && AppState.sidebarOpen) toggleSidebar();
    });

    // Workspace SVG Events (Pan, Drag, Connection Draft with Touch & Pointer Support)
    if (DOM.workspaceSvg) {
      if (window.PointerEvent) {
        DOM.workspaceSvg.addEventListener('pointerdown', handleWorkspaceMouseDown);
        window.addEventListener('pointermove', handleWorkspaceMouseMove);
        window.addEventListener('pointerup', handleWorkspaceMouseUp);
        window.addEventListener('pointercancel', handleWorkspaceMouseUp);
      } else {
        DOM.workspaceSvg.addEventListener('mousedown', handleWorkspaceMouseDown);
        window.addEventListener('mousemove', handleWorkspaceMouseMove);
        window.addEventListener('mouseup', handleWorkspaceMouseUp);
      }

      // Wheel Zoom
      DOM.workspaceSvg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        AppState.zoom = Math.max(0.4, Math.min(2.5, AppState.zoom * factor));
        updateViewBox();
      }, { passive: false });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isCtrlOrCmd && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          if (AppState.mode === 'simulate') return;
          if (AppState.selectedComponentId) {
            e.preventDefault();
            rotateComponent(AppState.selectedComponentId, 90);
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (AppState.mode === 'simulate') return;
        if (AppState.selectedComponentId) removeComponent(AppState.selectedComponentId);
        else if (AppState.selectedConnectionId) removeConnection(AppState.selectedConnectionId);
        else if (AppState.selectedJunctionId) removeJunction(AppState.selectedJunctionId);
      } else if (e.key === 'Escape') {
        if (AppState.connectionDrawing.active) cancelConnectionDrawing();
        deselectComponent();
        deselectConnection();
        deselectJunction();
        closeModal();
      } else if (e.key === '+' || e.key === '=') {
        zoomIn();
      } else if (e.key === '-' || e.key === '_') {
        zoomOut();
      } else if (e.key === '0') {
        zoomToFit();
      } else if (e.key === 's' || e.key === 'S') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          saveProjectToFile();
        }
      }
    });

    // Window Resize
    window.addEventListener('resize', () => {
      updateViewBox();
      if (window.innerWidth <= 768 && AppState.sidebarOpen) {
        AppState.sidebarOpen = false;
        if (DOM.sidebar) DOM.sidebar.classList.remove('sidebar-open');
      }
    });
  }

  // ============================================================
  // 20. INITIALIZATION
  // ============================================================

  function init() {
    initDOMReferences();
    initHistory();

    // Setup Infinite Background Grid
    if (DOM.workspaceBg) {
      DOM.workspaceBg.setAttribute('x', '-5000');
      DOM.workspaceBg.setAttribute('y', '-5000');
      DOM.workspaceBg.setAttribute('width', '10000');
      DOM.workspaceBg.setAttribute('height', '10000');
    }
    if (DOM.workspaceGrid) {
      DOM.workspaceGrid.setAttribute('x', '-5000');
      DOM.workspaceGrid.setAttribute('y', '-5000');
      DOM.workspaceGrid.setAttribute('width', '10000');
      DOM.workspaceGrid.setAttribute('height', '10000');
    }

    renderFilterButtons();
    renderLibrary();
    hidePropertyPanel();

    // Default: buka library & sidebar pada layar desktop (> 768px), tutup pada mobile/tablet (<= 768px)
    if (window.innerWidth <= 768) {
      AppState.sidebarOpen = false;
      if (DOM.sidebar) DOM.sidebar.classList.remove('sidebar-open');
      toggleLibrary(false);
    } else {
      AppState.sidebarOpen = true;
      if (DOM.sidebar) DOM.sidebar.classList.add('sidebar-open');
      toggleLibrary(true);
    }

    updateViewBox();
    updateComponentCount();
    updateConnectionCount();
    updateEmptyMessage();

    setupEventListeners();
    setMode('edit');

    // Set default initial view to Workspace
    showWorkspaceView();

    setTimeout(() => {
      showToast('Selamat datang di Pneulab — Media Pembelajaran Elektropneumatik SMK N 1 Padang', 'info', 4000);
    }, 600);
  }

  // Expose key API to window for testing and external controls
  window.showMaterialView = showMaterialView;
  window.showWorkspaceView = showWorkspaceView;
  window.toggleSidebar = toggleSidebar;
  window.toggleLibrary = toggleLibrary;
  window.switchMaterialTab = switchMaterialTab;
  window.closeMaterialInfo = closeMaterialInfo;
  window.AppState = AppState;
  window.SimEngine = SimEngine;
  window.setMode = setMode;
  window.loadPresetCircuit = loadPresetCircuit;
  window.selectMaterial = selectMaterial;
  window.workspaceComponents = workspaceComponents;
  window.rotateComponent = rotateComponent;
  window.addComponent = addComponent;
  window.removeComponent = removeComponent;
  window.selectComponent = selectComponent;
  window.clearAllComponents = clearAllComponents;
  window.getPortPosition = getPortPosition;
  window.getPortData = getPortData;
  window.connections = connections;
  window.junctions = junctions;
  window.saveProject = saveProject;
  window.loadProject = loadProject;
  window.saveProjectToFile = saveProjectToFile;
  window.openProjectFromFile = openProjectFromFile;
  window.saveToLocalStorage = saveToLocalStorage;
  window.loadFromLocalStorage = loadFromLocalStorage;
  window.validateProjectFile = validateProjectFile;
  window.migrateProjectData = migrateProjectData;
  window.createProjectData = createProjectData;
  window.applyProjectData = applyProjectData;
  window.componentLibrary = componentLibrary;
  window.getComponentDef = getComponentDef;
  window.renderComponentSymbol = renderComponentSymbol;
  window.addConnection = addConnection;
  window.removeConnection = removeConnection;
  window.addJunction = addJunction;
  window.removeJunction = removeJunction;
  window.addBranchConnection = addBranchConnection;
  window.updateNeutralWires = updateNeutralWires;
  window.getComponentById = getComponentById;
  window.renderConnection = renderConnection;
  window.renderComponent = renderComponent;
  window.runDiagnostics = runDiagnostics;
  window.zoomToFit = zoomToFit;
  window.calculateOrthogonalPath = calculateOrthogonalPath;
  window.AppState = AppState;
  window.undo = undo;
  window.redo = redo;
  window.commitState = commitState;
  window.initHistory = initHistory;
  window.historyStack = history;
  window.startComponentDrag = startComponentDrag;
  window.updateComponentPosition = updateComponentPosition;
  window.handleWorkspaceMouseUp = handleWorkspaceMouseUp;

  // Run when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
