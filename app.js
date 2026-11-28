

/* İçerik data/ klasöründeki JSON dosyalarından yüklenir; kod ile içerik ayrıdır. */
var DATA_FILES=["kaynaklar","cerrahi_bloklar","antitrombotik","komorbidite","kanit_panelleri","usg_baglantilari","dogrulama"];
function showMeta(M){var el=document.getElementById('datameta');if(!el)return;var bad=M.filter(function(m){return m.durum!=='onaylandı'});
  el.innerHTML='İçerik sürümü: '+M.map(function(m){return m.dosya+' '+m.surum+' ('+m.tarih+')'}).join(' · ')+(bad.length?' — <b>İkinci hekim kontrolü bekleyen dosyalar: '+bad.map(function(m){return m.dosya}).join(', ')+'</b>':' — tüm dosyalar onaylı');}
function APP(D){

  /* ---------- Kaynaklar ---------- */
  var ESAIC=D.ESAIC;
  var ASRA_NEURO=D.ASRA_NEURO;
  var ASA_OSA=D.ASA_OSA;
  var NYS_SYS=D.NYS_SYS;
  var NYS_AS=D.NYS_AS;
  var PRO=D.PRO;
  var ST={rec:'Önerilir',opt:'İsteğe bağlı',no:'Önerilmez',na:'Değerlendirilmedi'};
  var TECH={neuraxial:'nöroaksiyel',periph:'periferik blok',plane:'fasiyal plan bloğu',infil:'lokal infiltrasyon',other:'diğer'};

  /* ---------- Cerrahi katalogu (PROSPECT özetleri) ---------- */
  /* s: rec|opt|no|na  tech  n  w  anim: [anahtarlar]  opi: opioid içerir */
  var PROC=D.PROC;
  var EMPTY={
    'thorax-open':'',
    'lower-open':'Açık kolorektal cerrahi için özet okunmadı (PROSPECT 2016 açık kolorektal özeti mevcut).',
    'upper-open':'Açık üst batın cerrahisi için özet henüz eklenmedi. PROSPECT açık karaciğer rezeksiyonu özeti (2019) mevcut ama okunmadı.',
    'groin-closed':'PROSPECT 2019 herni özeti yalnızca açık inguinal onarımı kapsar. Laparoskopik herni için özet bulunmadı.',
    'breast-closed':'Kapalı meme cerrahisi için özet bulunmadı.',
    'limb-closed':'Alt ekstremitede kapalı (artroskopik) cerrahi için özet eklenmedi.',
    'spine-closed':'Kapalı (endoskopik, minimal invaziv) omurga cerrahisi için özet eklenmedi.'
  };

  /* ---------- Antitrombotik kurallar (ESAIC/ESRA 2022) ---------- */
  var NX_COMMON=D.NX_COMMON;
  var CATH=D.CATH;
  var AFTER_NA=D.AFTER_NA;
  var ACG=D.ACG;
  var SUP=D.SUP;
  var MONITOR=D.MONITOR;
  var ASRA5SRC=D.ASRA5SRC;
  var EGY=D.EGY;
  var GIST=D.GIST;
  var NYSDOAC=D.NYSDOAC;
  var PMCLLM=D.PMCLLM;
  var ESRANEWS=D.ESRANEWS;
  var EV_RULE=D.EV_RULE;
  var A5TH=D.A5TH;
  var A5=D.A5;
  var CASES=D.CASES;
  var EVCH={'Güçlü':'rec','Orta':'opt','Zayıf':'na'};
  var FOOT=D.FOOT;
  var RENAL=D.RENAL;
  var RENAL_NOTE=D.RENAL_NOTE;
  function renalHtml(a){
    if(a.id!=='lmwh_lo'&&a.id!=='lmwh_hi')return '';
    return '<details style="margin-top:12px"><summary>Böbrek fonksiyonu ve DMAH: nefroloji ve farmakoloji kaynakları</summary><ul class="notes" style="margin-top:10px">'+RENAL.map(function(r){return '<li><span class="chip '+(EVCH[r.e]||'na')+'">'+(r.e==='Dolaylı'?'Dolaylı':'Kanıt gücü: '+r.e)+'</span> <a href="https://doi.org/'+r.d+'" target="_blank" rel="noopener">'+esc(r.a)+'</a><br>'+esc(r.k)+'</li>'}).join('')+'</ul><p class="src" style="margin:10px 0 0">'+esc(RENAL_NOTE)+' '+esc(EV_RULE)+'</p></details>';
  }
  function fnRefs(id){var n=[];FOOT.forEach(function(f,i){if(f[0].indexOf(id)>=0)n.push(i+1)});return n.length?'<br><span class="src">Dipnot: '+n.join(', ')+'</span>':''}
  function a5html(a){
    var x=A5[a.id];
    if(!x)return '<dt>ASRA 5. baskı</dt><dd class="src">Bu ilaç için okunan metinde ayrı değer bulunamadı; yalnızca ESAIC/ESRA gösteriliyor.</dd>';
    return '<dt>ASRA 5. baskı (2025)</dt><dd>'+esc(x.t)+'<br><span class="chip '+(EVCH[x.e]||'na')+'">'+(x.e==='?'?'Kesinlik okunamadı':'Kanıt gücü: '+x.e)+'</span> <span class="src">ASRA etiketi: '+esc(x.g)+'</span>'+(x.th?'<br><span class="src">'+esc(A5TH)+'</span>':'')+'<br><span class="src">Okunan metin: '+src(EGY)+'. Ek doğrulama: '+(x.x?x.x.map(src).join(' · '):'yok (yalnızca uyarlama metni)')+'.</span>'+fnRefs(a.id)+'<br><span class="src">İki kılavuz arasında fark varsa karar hekime aittir.</span></dd>';
  }

  /* ---------- Hasta faktörleri ---------- */
  var COM=D.COM;
  var COMIDS=['osa','copd','as','card','sten','neuro','sed','hypo','anem'];

  /* ---------- Yardımcılar ---------- */
  function $(id){return document.getElementById(id)}
  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function src(o){return '<a href="'+o.u+'" target="_blank" rel="noopener">'+esc(o.t)+'</a>'}
  function fmt(d){return d.toLocaleString('tr-TR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
  function on(id){return $('c-'+id).checked}

  /* ---------- Şematik animasyonlu çizimler ---------- */
  function B(y0,y1,c,l){return '<rect x="0" y="'+y0+'" width="420" height="'+(y1-y0)+'" class="'+c+'"/>'+(l?'<text x="8" y="'+((y0+y1)/2+3.5)+'" class="lb">'+l+'</text>':'')}
  function R(x,y,w,h,c,r){return '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(r||0)+'" class="'+c+'"/>'}
  function E(cx,cy,rx,ry,c){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" class="'+c+'"/>'}
  function LN(x1,y1,x2,y2,c){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" class="'+c+'"/>'}
  function N(x1,y1,x2,y2){var L=Math.round(Math.hypot(x2-x1,y2-y1));return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" style="stroke:var(--fg);stroke-width:2.6;stroke-linecap:round;opacity:.4"/><line class="nd" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke-dasharray="'+L+'" style="--len:'+L+'"/>'}
  function LA(cx,cy,rx,ry){return '<ellipse class="la" cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'"/>'}
  var SW={bone:'t-bone',peri:'t-peri',fat:'t-fat',musc:'t-musc2',lung:'t-lung',csf:'t-csf',lig:'t-lig',vessel:'t-vessel',vein:'t-vein',nerve:'t-nerve',la:'t-la'};
  var SWC={cart:'#DCE6EA',bone:'#F2ECDD',peri:'#F7EEE9',fat:'#FFF6DC',musc:'#D3645C',lung:'#E3F0F7',csf:'#DDEFF8',lig:'#F3E6BD',vessel:'#D0251B',vein:'#2B5BB5',nerve:'#BDBDBD',la:'#2ECC40'};
  function leg(items){return '<div class="leg">'+items.map(function(i){return '<span><i style="background:'+(SWC[i[0]]||'var(--'+SW[i[0]]+')')+'"></i>'+i[1]+'</span>'}).join('')+'<span><i style="background:#111"></i>iğne</span></div>'}
  function fig(title,svgInner,caption,legend){return '<div class="fig"><p class="ft">'+title+'</p><svg class="sch" viewBox="0 0 420 220" role="img" aria-label="'+title+' şematik çizimi">'+svgInner+'</svg>'+leg(legend)+'<p class="fc">'+caption+'</p></div>'}
  var ANIM={
    esp:function(){return fig('Erector spinae plan bloğu',
      B(18,26,'t-skin','Cilt')+B(26,52,'t-fat','Deri altı')+B(52,78,'t-musc','Trapezius')+B(78,118,'t-musc2','Erektör spina kası')+B(118,148,'t-peri','')+
      R(60,118,64,26,'t-bone',8)+R(190,118,64,26,'t-bone',8)+R(320,118,64,26,'t-bone',8)+B(148,205,'t-lung','Akciğer / plevra')+LN(0,148,420,148,'fas')+
      LA(222,114,104,5)+N(40,26,222,117),
      'Parasagital şematik görünüm. Enjektat, erektör spina kası ile transvers çıkıntı arasındaki planda yayılır.',[['bone','transvers çıkıntı'],['la','lokal anestezik']])},
    tap:function(){return fig('TAP bloğu',
      B(18,26,'t-skin','Cilt')+B(26,60,'t-fat','Deri altı')+B(60,84,'t-musc','Dış oblik')+B(84,110,'t-musc2','İç oblik')+B(110,126,'t-musc','Transversus abdominis')+B(126,134,'t-peri','Periton')+B(134,205,'t-lung','Karın boşluğu')+
      LA(250,110,88,5)+N(30,32,250,110),
      'Enine şematik görünüm. Enjektat, iç oblik ile transversus abdominis arasındaki fasiyal planda yayılır.',[['la','lokal anestezik']])},
    fib:function(){return fig('Fasya iliaka bloğu',
      B(18,26,'t-skin','Cilt')+B(26,62,'t-fat','Deri altı yağ')+B(62,96,'t-peri','')+B(96,150,'t-musc','İliakus kası')+B(150,205,'t-bone','Pelvis kemiği')+LN(0,96,420,96,'fas')+
      E(150,80,9,9,'t-vein')+E(190,80,10,10,'t-vessel')+E(230,82,10,6,'t-nerve')+
      '<text x="412" y="91" class="lb" text-anchor="end">Fasya iliaka</text><text x="8" y="215" class="lb">medial</text><text x="412" y="215" class="lb" text-anchor="end">lateral</text>'+
      LA(250,98,86,5)+N(400,40,262,98),
      'Kasık bölgesi, enine şematik görünüm. Enjektat, fasya iliaka ile iliakus kası arasında yayılır.',[['vein','femoral ven'],['vessel','femoral arter'],['nerve','femoral sinir'],['la','lokal anestezik']])},
    acb:function(){return fig('Aduktör kanal bloğu',
      B(18,26,'t-skin','Cilt')+B(26,50,'t-fat','Deri altı')+E(210,68,82,17,'t-musc')+E(332,114,70,34,'t-musc2')+E(88,114,64,30,'t-musc2')+E(210,186,34,30,'t-bone')+
      E(188,114,8,8,'t-vein')+E(206,100,9,9,'t-vessel')+E(226,98,6,5,'t-nerve')+
      '<text x="210" y="72" class="lb" text-anchor="middle">Sartorius</text><text x="332" y="118" class="lb" text-anchor="middle">Vastus medialis</text><text x="88" y="118" class="lb" text-anchor="middle">Addüktör longus</text><text x="210" y="190" class="lb" text-anchor="middle">Femur</text>'+
      LA(208,104,38,22)+N(40,34,222,90),
      'Orta uyluk, enine şematik görünüm. Enjektat, sartorius altında femoral arteri çevreleyen kanalda yayılır.',[['vessel','femoral arter'],['vein','femoral ven'],['nerve','safen sinir'],['la','lokal anestezik']])},
    spinal:function(){return spinalFig('Spinal (intratekal) uygulama',150,'Enjektat, BOS içinde yayılır.',['la','lokal anestezik / opioid'])},
    epidural:function(){return spinalFig('Epidural uygulama',112,'Enjektat, dura dışındaki epidural boşlukta yayılır.',['la','lokal anestezik'])},
    pvb:function(){return fig('Paravertebral blok',
      B(18,26,'t-skin','Cilt')+B(26,52,'t-fat','Deri altı')+B(52,112,'t-musc2','Trapezius ve erektör spina kası')+B(112,148,'t-fat','')+
      R(40,112,80,26,'t-bone',8)+R(300,112,80,26,'t-bone',8)+R(120,112,180,5,'t-lig',2)+B(148,205,'t-lung','Akciğer / plevra')+LN(0,148,420,148,'fas')+
      LA(200,132,66,15)+N(60,26,190,128),
      'Parasagital şematik görünüm. İğne, komşu transvers çıkıntılar arasından geçip plevra üstündeki paravertebral boşlukta enjektat bırakır.',[['bone','transvers çıkıntı'],['lig','kostotransvers bağ'],['fat','paravertebral boşluk'],['la','lokal anestezik']])}
  };
  function spinalFig(title,tipY,cap,la){
    var inner=B(14,22,'t-skin','Cilt')+B(22,40,'t-fat','Deri altı')+R(0,40,420,135,'t-peri')+
      R(108,36,44,70,'t-bone',10)+R(248,36,44,70,'t-bone',10)+R(96,98,56,28,'t-bone',6)+R(248,98,56,28,'t-bone',6)+
      R(152,96,96,8,'t-lig')+R(152,104,96,16,'t-fat')+R(152,120,96,52,'t-csf')+LN(152,120,248,120,'fas')+
      '<path d="M186 128 V166 M200 126 V168 M214 128 V166" class="rootl"/>'+R(60,176,300,36,'t-bone',12)+
      '<text x="8" y="19" class="lb">Cilt</text><text x="8" y="34" class="lb">Deri altı</text><text x="200" y="196" class="lb" text-anchor="middle">Vertebra cismi</text><text x="8" y="215" class="lb">posterior üstte</text>';
    var cy=tipY, rx=tipY>130?46:56, ry=tipY>130?17:6;
    return fig(title,inner+LA(200,cy,rx,ry)+N(200,8,200,tipY),'Orta hat, sagital şematik görünüm. '+cap,[['bone','spinöz çıkıntı / lamina'],['peri','interspinöz bağ'],['lig','ligamentum flavum'],['fat','epidural boşluk'],['csf','BOS'],['nerve','sinir kökleri'],la]);
  }
  var ANAME={sgb:'Stellat ganglion',shp:'Süperior hipogastrik pleksus',ii:'İlioinguinal/iliohipogastrik',pop:'Popliteal siyatik',saphen:'Safen',ipack:'IPACK',esp:'ESP',tap:'TAP',fib:'Fasya iliaka',acb:'Aduktör kanal',spinal:'Spinal',epidural:'Epidural',pvb:'Paravertebral'};
  /* ---------- Ek blok animasyonları (şematik) ---------- */
  function T(x,y,s,a){return '<text x="'+x+'" y="'+y+'" class="lb"'+(a?' text-anchor="'+a+'"':'')+'>'+s+'</text>'}
  function SK(f){return B(18,26,'t-skin','Cilt')+B(26,f||40,'t-fat','Deri altı')}
  function QLB2(){return SK()+R(0,40,420,172,'t-fat')+R(0,40,200,22,'t-musc')+R(0,62,200,22,'t-musc2')+R(0,84,200,18,'t-musc')+LN(200,93,240,100,'fas')+
    R(200,26,220,24,'t-musc')+E(120,172,70,28,'t-peri')+E(270,172,58,30,'t-musc')+R(330,142,90,12,'t-bone',4)+E(400,112,40,46,'t-musc')+E(290,104,70,30,'t-musc2')+
    T(8,55,'Dış oblik')+T(8,77,'İç oblik')+T(8,97,'Transversus abd.')+T(412,42,'Latissimus dorsi','end')+T(290,108,'QL','middle')+T(270,176,'Psoas','middle')+T(410,100,'ESK','end')+T(380,166,'TP','middle')+T(120,176,'Böbrek','middle')+T(8,215,'lateral')+T(412,215,'posterior','end')}
  var QLLEG=[['bone','transvers çıkıntı (L4)'],['fat','retroperitoneal yağ'],['la','lokal anestezik']];
  var ANIM2={
    isb:function(){return fig('İnterskalen blok',
      SK(44)+R(0,44,420,168,'t-peri')+E(110,60,96,16,'t-musc')+E(150,130,34,46,'t-musc2')+E(304,130,54,52,'t-musc2')+E(60,122,18,18,'t-vessel')+E(84,90,20,11,'t-vein')+R(150,188,180,24,'t-bone',8)+
      LA(226,128,26,42)+E(222,104,9,9,'t-nerve')+E(226,128,10,10,'t-nerve')+E(228,152,10,10,'t-nerve')+
      T(110,64,'SKM','middle')+T(150,134,'Ön skalen','middle')+T(304,134,'Orta skalen','middle')+T(240,107,'C5')+T(244,131,'C6')+T(246,155,'C7')+T(240,204,'Vertebra','middle')+N(412,60,242,128),
      'Boyun, enine şematik görünüm. İğne orta skalen kastan geçer; enjektat C5–C6 kökleri çevresinde, ön ve orta skalen arasında yayılır.',[['nerve','C5–C7 kökleri'],['vessel','karotis'],['vein','internal juguler ven'],['la','lokal anestezik']])},
    scb:function(){return fig('Supraklaviküler blok',
      SK(40)+R(0,40,420,172,'t-peri')+E(70,96,70,44,'t-musc2')+R(300,168,120,44,'t-lung')+R(140,168,160,22,'t-bone',10)+
      LA(228,138,44,24)+E(300,130,18,16,'t-vessel')+[[208,124],[224,116],[240,128],[218,140],[234,148],[250,140],[206,152]].map(function(p){return E(p[0],p[1],7,7,'t-nerve')}).join('')+
      T(70,100,'Orta skalen','middle')+T(220,204,'1. kaburga','middle')+T(360,196,'Plevra','middle')+T(300,108,'SA','middle')+N(10,150,200,164),
      'Supraklaviküler fossa, şematik görünüm. Pleksus subklavyen arterin lateralinde; enjektat pleksus ile birinci kaburga arasındaki köşeden başlayarak yayılır.',[['nerve','brakiyal pleksus'],['vessel','subklavyen arter'],['bone','1. kaburga'],['lung','plevra'],['la','lokal anestezik']])},
    icb:function(){return fig('İnfraklaviküler blok',
      SK(40)+B(40,80,'t-musc','Pektoralis majör')+B(80,112,'t-musc2','Pektoralis minör')+B(112,212,'t-peri','')+R(320,190,100,22,'t-bone',8)+
      LA(212,164,34,22)+E(210,150,16,15,'t-vessel')+E(272,160,14,11,'t-vein')+E(186,128,7,6,'t-nerve')+E(212,178,7,6,'t-nerve')+E(236,162,6,5,'t-nerve')+
      T(176,124,'LK','end')+T(224,198,'PK','middle')+T(244,178,'MK')+T(210,153,'AA','middle')+T(272,163,'AV','middle')+N(16,30,200,170),
      'Parasagital şematik görünüm, kranial solda. İğne arterin arkasına (saat 6) ilerler; enjektat aksiller arteri U biçiminde sarar ve üç kordu kapsar.',[['vessel','aksiller arter'],['vein','aksiller ven'],['nerve','lateral, posterior, medial kord'],['la','lokal anestezik']])},
    axb:function(){return fig('Aksiller blok',
      SK(40)+R(0,40,420,172,'t-peri')+E(110,66,104,22,'t-musc')+E(60,120,62,30,'t-musc2')+R(0,170,420,42,'t-musc2')+LN(0,168,420,168,'fas')+
      LA(222,110,44,32)+E(222,110,13,12,'t-vessel')+E(258,96,10,7,'t-vein')+E(264,128,9,6,'t-vein')+E(196,92,8,6,'t-nerve')+E(252,72,7,5,'t-nerve')+E(222,140,7,5,'t-nerve')+E(60,120,7,5,'t-nerve')+
      T(110,70,'Biseps','middle')+T(60,104,'Korakobrakiyal','middle')+T(8,194,'Triseps')+T(186,90,'M','end')+T(262,70,'U')+T(234,150,'R')+T(72,124,'MK')+T(222,113,'AA','middle')+N(8,44,198,104),
      'Aksilla, enine şematik görünüm. Median, ulnar ve radiyal sinir aksiller arter çevresinde; muskulokutan sinir korakobrakiyal kas içinde. Enjektat her sinirin çevresine verilir.',[['vessel','aksiller arter'],['vein','aksiller venler'],['nerve','M, U, R, MK sinirleri'],['la','lokal anestezik']])},
    ssn:function(){return fig('Suprascapular sinir bloğu (posterior)',
      SK(40)+B(40,80,'t-musc','Trapezius')+B(80,140,'t-musc2','Supraspinatus')+R(0,140,420,72,'t-peri')+'<path d="M0 150 Q210 214 420 144 L420 220 L0 220Z" class="t-bone"/>'+
      LA(212,172,50,9)+E(224,176,6,5,'t-vessel')+E(204,176,5,5,'t-nerve')+T(210,206,'Supraskapular fossa','middle')+N(404,30,214,172),
      'Koronal şematik görünüm. Sinir ve suprascapular arter fossa tabanında; enjektat supraspinatus ile kemik arasına verilir.',[['nerve','suprascapular sinir'],['vessel','suprascapular arter'],['bone','skapula'],['la','lokal anestezik']])},
    pecs:function(){return fig('PECS bloğu (interpektoral + pektoserratus)',
      SK(40)+B(40,80,'t-musc','Pektoralis majör')+B(80,112,'t-musc2','Pektoralis minör')+B(112,140,'t-musc','Serratus anterior')+B(140,212,'t-lung','Plevra / akciğer')+R(40,140,110,22,'t-bone',10)+R(250,140,110,22,'t-bone',10)+
      LA(190,80,72,6)+LA(290,112,80,6)+E(230,80,7,6,'t-vessel')+T(190,70,'PECS I','middle')+T(300,102,'PECS II','middle')+N(16,30,300,110),
      'Ön aksiller hat, şematik görünüm. PECS I: enjektat pektoralis majör ile minör arasına (torakoakromiyal arter yanında). PECS II: pektoralis minör ile serratus anterior arasına.',[['vessel','torakoakromiyal arter'],['bone','kaburga'],['la','lokal anestezik']])},
    sap:function(){return fig('Serratus anterior plan bloğu',
      SK(40)+B(40,80,'t-musc','Latissimus dorsi')+B(80,120,'t-musc2','Serratus anterior')+B(120,212,'t-lung','Plevra / akciğer')+R(60,120,110,22,'t-bone',10)+R(260,120,110,22,'t-bone',10)+
      LA(230,80,80,6)+LA(316,120,58,5)+E(180,80,6,5,'t-vessel')+T(230,70,'yüzeyel','middle')+T(316,110,'derin','middle')+N(412,30,316,118),
      'Orta aksiller hat, 4–5. kaburga, şematik görünüm. Yüzeyel: enjektat latissimus dorsi ile serratus arasına. Derin: serratus ile kaburga arasına.',[['vessel','torakodorsal arter'],['bone','kaburga'],['la','lokal anestezik']])},
    spsip:function(){return fig('SPSIP bloğu',
      SK(38)+B(38,66,'t-musc','Trapezius')+B(66,94,'t-musc2','Romboid')+B(94,108,'t-musc','Serratus posterior superior')+B(108,140,'t-peri','İnterkostal kaslar')+B(140,212,'t-lung','Plevra / akciğer')+R(50,108,110,24,'t-bone',10)+R(250,108,110,24,'t-bone',10)+
      LA(300,107,80,5)+T(105,124,'2. kaburga','middle')+T(305,124,'3. kaburga','middle')+N(412,20,300,106),
      'Skapula medial kenarı, 2.–3. kaburga düzeyi, şematik görünüm. İğne kaburgaya temas eder; enjektat serratus posterior superior kası ile kaburga/interkostal kaslar arasındaki fasyal plana verilir ve kaburgalar boyunca kraniyokaudal yayılır.',[['bone','kaburga'],['la','lokal anestezik']])},
    rib:function(){return fig('Romboid interkostal blok',
      SK(40)+B(40,68,'t-musc','Trapezius')+B(68,110,'t-musc2','Romboid majör')+B(110,140,'t-peri','İnterkostal kaslar')+B(140,212,'t-lung','Plevra / akciğer')+R(362,40,58,70,'t-bone',12)+R(120,110,100,24,'t-bone',10)+R(260,110,96,24,'t-bone',10)+
      LA(240,110,92,6)+T(391,80,'Skapula','middle')+N(350,26,240,108),
      'Skapula ile omurga arası, şematik görünüm. Enjektat romboid majör ile interkostal kaslar arasındaki planda yayılır.',[['bone','skapula / kaburga'],['la','lokal anestezik']])},
    mtapa:function(){return fig('M-TAPA (perikondriyal)',
      SK(44)+B(44,84,'t-musc','Dış oblik / rektus')+B(84,122,'t-fat','')+B(122,140,'t-musc2','Transversus abdominis')+B(140,212,'t-peri','Karaciğer / periton')+E(262,102,96,18,'t-bone')+
      LA(250,122,96,6)+T(262,106,'Kostal kıkırdak','middle')+N(20,44,186,121),
      'Kostal kenar, sagital oblik şematik görünüm. İğne kostokondral kıkırdağın alt yüzüne ilerler; enjektat kıkırdak ile transversus abdominis arasına verilir.',[['bone','kostal kıkırdak'],['la','lokal anestezik']])},
    rsb:function(){return fig('Rektus kılıf bloğu',
      SK(60)+B(60,124,'t-musc','')+R(0,60,14,72,'t-lig')+T(22,95,'Rektus abdominis')+B(124,132,'t-lig','')+B(132,140,'t-peri','')+B(140,212,'t-lung','Karın boşluğu')+
      LA(250,124,92,6)+E(300,118,6,5,'t-vessel')+T(412,130,'Arka kılıf / periton','end')+N(412,30,240,123),
      'Göbek düzeyi, enine şematik görünüm; linea alba solda. Enjektat rektus kası ile arka rektus kılıfı arasına verilir; inferior epigastrik artere dikkat.',[['lig','linea alba / arka kılıf'],['vessel','inferior epigastrik arter'],['la','lokal anestezik']])},
    eoi:function(){return fig('External oblique intercostal (EOI) bloğu',
      SK(44)+B(44,80,'t-musc','Dış oblik')+B(80,112,'t-peri','İnterkostal kaslar')+B(112,212,'t-lung','Plevra / akciğer')+R(40,80,110,24,'t-bone',10)+R(260,80,110,24,'t-bone',10)+
      LA(205,80,92,6)+T(95,96,'6. kaburga','middle')+N(20,30,200,79),
      'Ön aksiller hat, 6. kaburga, parasagital şematik görünüm. Enjektat dış oblik kas ile kaburga/interkostal kaslar arasındaki planda yayılır.',[['bone','kaburga'],['la','lokal anestezik']])},
    rifpb:function(){return fig('Rektointerkostal fasiyal plan bloğu (RIFPB)',
      SK(40)+B(40,88,'t-musc','Rektus abdominis')+B(88,120,'t-peri','İnterkostal kaslar')+B(120,132,'t-musc2','Transversus torasis')+B(132,212,'t-peri','Periton')+E(90,104,60,15,'t-bone')+E(320,104,60,15,'t-bone')+
      LA(205,88,92,6)+T(90,108,'Kıkırdak','middle')+T(320,108,'Kıkırdak','middle')+N(20,30,205,87),
      '6–7. kostal kıkırdaklar, parasagital şematik görünüm. Enjektat rektus abdominis ile 6.–7. kostal kıkırdaklar arasındaki planda yayılır.',[['bone','kostal kıkırdak'],['la','lokal anestezik']])},
    ql1:function(){return fig('QL1 (lateral kuadratus lumborum)',QLB2()+LA(222,104,16,22)+N(10,30,214,100),
      'Flank, enine şematik görünüm. Enjektat QL kasının anterolateral kenarına, transversus abdominis aponerozu ile transversalis fasya arasına verilir.',QLLEG)},
    ql2:function(){return fig('QL2 (posterior kuadratus lumborum)',QLB2()+LA(310,76,52,6)+N(10,30,300,74),
      'Flank, enine şematik görünüm. Enjektat QL kasının posterior yüzeyine, QL ile latissimus dorsi/ESK arasındaki torakolomber fasya katmanına verilir.',QLLEG)},
    ql3:function(){return fig('QL3 (transmüsküler / anterior kuadratus lumborum)',QLB2()+LA(276,140,48,8)+N(412,34,280,136),
      'Flank, enine şematik görünüm. İğne QL kasını geçer; enjektat QL ile psoas arasındaki fasiyal plana verilir.',QLLEG)},
    tfpb:function(){return fig('Transversalis fasya plan bloğu',
      SK(40)+R(0,40,420,172,'t-fat')+R(0,40,300,22,'t-musc')+R(0,62,300,24,'t-musc2')+R(0,86,300,18,'t-musc')+E(372,112,58,52,'t-musc2')+LN(0,106,320,106,'fas')+
      LA(250,106,60,5)+T(8,55,'Dış oblik')+T(8,78,'İç oblik')+T(8,99,'Transversus abd.')+T(372,116,'QL','middle')+T(150,124,'Transversalis fasya','middle')+T(150,170,'Retroperitoneal yağ','middle')+N(10,30,250,104),
      'İliak krista üzeri, enine şematik görünüm. Enjektat transversus abdominis ile transversalis fasya arasına, kasın aponeroza dönüştüğü yerin yakınına verilir.',[['fat','retroperitoneal yağ'],['la','lokal anestezik']])},
    peng:function(){return fig('PENG bloğu',
      SK(46)+R(0,46,420,166,'t-peri')+R(60,60,260,84,'t-musc')+'<path d="M0 160 Q60 120 120 145 Q200 180 280 150 Q330 135 420 148 L420 220 L0 220Z" class="t-bone"/>'+
      LA(220,158,52,6)+E(220,150,22,7,'t-lig')+E(320,70,13,12,'t-vessel')+E(352,74,11,9,'t-vein')+E(290,82,9,6,'t-nerve')+
      T(190,100,'İliopsoas','middle')+T(60,150,'AİİS','middle')+T(300,166,'İPE','middle')+T(220,140,'Psoas tendonu','middle')+N(8,40,200,158),
      'İnguinal ligament altı, pubik ramusa paralel şematik görünüm. Enjektat psoas tendonu ile pubik ramus arasına, kemik üzerine verilir.',[['bone','AİİS / iliopubik eminens'],['lig','psoas tendonu'],['vessel','femoral arter'],['vein','femoral ven'],['nerve','femoral sinir'],['la','lokal anestezik']])}
  };
  for(var _k in ANIM2)ANIM[_k]=ANIM2[_k];
  /* ---------- Diz altı ve diz arkası blokları: animasyon ---------- */
  var ANIM3={
    pop:function(){return fig('Popliteal siyatik sinir bloğu',
      SK(60)+R(0,60,420,152,'t-fat')+E(80,104,82,40,'t-musc')+E(344,104,80,42,'t-musc2')+R(40,182,320,30,'t-bone',12)+
      E(212,136,12,9,'t-vein')+E(226,158,11,10,'t-vessel')+LA(200,96,44,20)+E(184,96,10,8,'t-nerve')+E(214,94,12,9,'t-nerve')+
      T(80,108,'Biseps femoris','middle')+T(344,108,'Semimembranöz','middle')+T(184,80,'OPS','middle')+T(214,78,'TS','middle')+T(240,140,'PV')+T(242,162,'PA')+T(200,202,'Femur','middle')+
      T(8,215,'lateral')+T(412,215,'medial','end')+N(8,66,198,84),
      'Popliteal fossa, bifurkasyon düzeyi, enine şematik görünüm. Tibial ve ortak peroneal sinir ortak paranöral kılıf içinde; iğne lateralden girer, enjektat kılıf içinde iki siniri çevreler.',[['nerve','tibial ve ortak peroneal sinir'],['vessel','popliteal arter'],['vein','popliteal ven'],['la','lokal anestezik']])},
    ii:function(){return fig('İlioinguinal / iliohipogastrik sinir bloğu',
      SK(50)+B(50,74,'t-musc','Dış oblik aponörozu')+B(74,106,'t-musc2','İç oblik')+B(106,130,'t-musc','Transversus abdominis')+B(130,205,'t-peri','Periton / barsak')+R(332,30,88,120,'t-bone',14)+
      LA(252,106,42,6)+E(238,106,6,5,'t-nerve')+E(266,106,6,5,'t-nerve')+E(298,112,4,3,'t-vessel')+
      T(376,94,'SİAS','middle')+T(238,124,'İH','middle')+T(266,124,'İİ','middle')+T(8,215,'medial')+T(412,215,'lateral','end')+N(20,40,214,104),
      'SİAS ile göbeği birleştiren çizgide, SİAS\'in hemen medialinde enine şematik görünüm. İlioinguinal ve iliohipogastrik sinirler iç oblik ile transversus abdominis arasındaki planda seyreder; iğne medialden girer, enjektat bu planda iki siniri çevreler. Derin sirkumfleks iliak arter komşudur.',[['nerve','ilioinguinal ve iliohipogastrik sinir'],['vessel','derin sirkumfleks iliak arter'],['bone','SİAS'],['la','lokal anestezik']])},
    sgb:function(){return fig('Stellat ganglion bloğu (C6, lateral yaklaşım)',
      SK(36)+R(0,36,420,170,'t-fat')+E(300,58,96,18,'t-musc')+R(0,60,46,84,'t-peri',18)+E(84,86,48,28,'t-peri')+R(110,168,170,32,'t-bone',10)+E(304,160,20,14,'t-bone')+E(180,150,52,16,'t-musc2')+LN(110,134,272,134,'fas')+
      LA(200,131,42,6)+E(176,130,7,5,'t-nerve')+E(200,92,16,16,'t-vessel')+E(252,84,22,13,'t-vein')+E(264,184,7,6,'t-vessel')+
      T(300,62,'SKM','middle')+T(84,90,'Tiroid','middle')+T(23,104,'Trakea','middle')+T(200,70,'KA','middle')+T(252,66,'İJV','middle')+T(180,156,'Longus colli','middle')+T(164,124,'SZ','end')+T(196,196,'C6','middle')+T(276,190,'VA')+T(304,164,'AT','middle')+
      T(8,215,'medial')+T(412,215,'lateral','end')+N(412,110,224,131),
      'C6 düzeyinde enine şematik görünüm (lateral yaklaşım). Servikal sempatik zincir longus colli kasının önünde, prevertebral fasyanın altındadır. İğne lateralden, internal juguler ven ve karotisin arkasından geçer; enjektat prevertebral fasyanın altında longus colli üzerinde yayılır. Vertebral arter, tiroid damarları ve özofagusa dikkat; damar yolu Doppler ile kontrol edilir. AT: C6 anterior tüberkülü.',[['nerve','servikal sempatik zincir'],['vessel','karotis ve vertebral arter'],['vein','internal juguler ven'],['bone','C6 transvers çıkıntı'],['la','lokal anestezik']])},
    shp:function(){return fig('Süperior hipogastrik pleksus bloğu (intraoperatif)',
      B(18,96,'t-peri','Periton boşluğu (açık karın)')+R(0,100,420,40,'t-fat')+LN(0,100,420,100,'fas')+R(40,142,168,60,'t-bone',10)+R(210,150,18,46,'t-peri',4)+R(230,146,180,56,'t-bone',10)+
      LA(214,124,48,9)+E(180,124,8,4,'t-nerve')+E(212,122,8,4,'t-nerve')+E(244,124,8,4,'t-nerve')+E(118,118,16,9,'t-vein')+E(312,130,4,3,'t-vessel')+
      T(8,112,'Arka periton altı')+T(124,176,'L5','middle')+T(320,178,'S1','middle')+T(220,142,'Promontoryum','middle')+T(118,106,'Sol oİV','middle')+T(212,114,'SHP','middle')+T(320,124,'MSA','middle')+
      T(8,215,'kranial')+T(412,215,'kaudal','end')+N(196,24,214,116),
      'Orta hat sagital şematik görünüm, açık abdominal histerektomi. Süperior hipogastrik pleksus L5–S1 (sakral promontoryum) önünde, retroperitoneal yerleşimlidir. Cerrah arka peritonu görerek promontoryum önüne enjeksiyon yapar; sol ortak iliak ven (Sol oİV) ve median sakral arter (MSA) komşudur, enjeksiyondan önce aspirasyon gerekir.',[['nerve','süperior hipogastrik pleksus'],['vein','sol ortak iliak ven'],['vessel','median sakral arter'],['bone','L5 ve S1 omur'],['la','lokal anestezik']])},
    saphen:function(){return fig('Safen sinir bloğu (distal uyluk)',
      SK(40)+R(0,40,420,172,'t-peri')+E(70,132,80,48,'t-musc2')+E(346,132,70,46,'t-musc')+E(210,72,96,28,'t-musc')+R(20,186,180,26,'t-bone',12)+
      LA(214,104,42,10)+E(210,104,6,5,'t-nerve')+E(232,108,5,4,'t-vessel')+
      T(210,76,'Sartorius','middle')+T(70,136,'Vastus medialis','middle')+T(346,136,'Grasilis','middle')+T(110,202,'Femur','middle')+T(198,100,'SS','end')+N(8,44,200,100),
      'Distal uyluk medialinde (aduktör kanal distali) enine şematik görünüm. Safen sinir sartorius altında, inen genikuler artere komşu; enjektat sartorius altında siniri çevreler.',[['nerve','safen sinir'],['vessel','inen genikuler arter'],['la','lokal anestezik']])},
    ipack:function(){return fig('IPACK bloğu',
      SK(50)+R(0,50,420,162,'t-fat')+E(90,96,90,36,'t-musc2')+E(336,96,84,36,'t-musc')+'<path d="M20 196 Q90 150 170 176 Q210 188 250 176 Q330 150 400 196 L400 220 L20 220Z" class="t-bone"/>'+
      LA(210,172,70,8)+E(214,148,12,11,'t-vessel')+E(240,138,11,8,'t-vein')+E(206,104,10,8,'t-nerve')+
      T(90,100,'Semimembranöz','middle')+T(336,100,'Biseps femoris','middle')+T(214,151,'PA','middle')+T(254,134,'PV')+T(222,100,'TS')+T(96,206,'Medial kondil','middle')+T(330,206,'Lateral kondil','middle')+
      T(8,215,'medial')+T(412,215,'lateral','end')+N(8,150,228,172),
      'Diz arkası, femur kondilleri düzeyi, enine şematik görünüm. İğne medialden girer; enjektat popliteal arter ile femur arasındaki boşlukta, diz kapsülünün arkasında yayılır.',[['bone','femur kondilleri'],['vessel','popliteal arter'],['vein','popliteal ven'],['nerve','tibial sinir'],['la','lokal anestezik']])}
  };
  for(var _k3 in ANIM3)ANIM[_k3]=ANIM3[_k3];
  var ANIM4={
    ccb:function(){return fig('Kostoklaviküler brakiyal pleksus bloğu',
      SK(40)+B(40,84,'t-musc','Pektoralis majör')+E(300,96,92,13,'t-musc2')+B(162,188,'t-musc2','Serratus anterior / göğüs duvarı')+R(0,188,420,24,'t-lung')+
      LA(210,129,32,22)+E(198,128,9,7,'t-nerve')+E(216,119,9,7,'t-nerve')+E(218,139,9,7,'t-nerve')+E(266,130,15,14,'t-vessel')+E(330,134,20,12,'t-vein')+
      T(330,100,'Subklavius','middle')+T(188,112,'LK','end')+T(230,112,'PK')+T(232,152,'MK')+T(266,112,'AA','middle')+T(330,118,'AV','middle')+T(210,204,'Plevra','middle')+
      T(8,215,'lateral')+T(412,215,'medial','end')+N(8,56,196,126),
      'İnfraklaviküler fossa, klavikulaya paralel ve hafif sefalad eğik enine şematik görünüm. Lateral, posterior ve medial kordlar subklavius ile serratus anterior arasındaki kostoklaviküler aralıkta, aksiller arterin lateralinde bir arada bulunur. İğne lateralden in-plane girer; enjektat kord kümesinin ortasından üç kordu birlikte sarar.',[['musc','kaslar'],['nerve','kordlar'],['vessel','aksiller arter'],['vein','aksiller ven'],['lung','plevra'],['la','lokal anestezik']])},
    cpb:function(){return fig('Klavipektoral fasyal plan bloğu',
      SK(42)+R(0,42,420,170,'t-fat')+B(42,66,'t-musc','Platisma')+E(86,150,86,40,'t-musc2')+E(354,150,70,34,'t-musc')+E(210,148,58,34,'t-bone')+E(206,194,42,11,'t-musc2')+
      '<path d="M140 120 Q210 96 280 120" class="fas" fill="none"/>'+LA(210,108,64,8)+
      T(86,154,'Pektoralis majör','middle')+T(354,154,'Deltoid / trapez','middle')+T(210,152,'Klavikula','middle')+T(206,212,'Subklavius','middle')+T(300,96,'Klavipektoral fasya')+T(148,100,'LA','end')+
      T(8,215,'kaudal')+T(412,215,'kranial','end')+N(8,56,172,106),
      'Klavikulanın kısa ekseninde, kırık hattının medial ve lateralinde ayrı ayrı alınan şematik kesit. Klavipektoral fasya klavikulanın üst yüzeyini sarar; iğne kemiğe değene dek ilerler, enjektat fasya ile periost arasında kemiğin üst yüzeyine yayılır. Supraklaviküler sinirlerle innerve olan deri için ayrıca süperfisyal servikal veya supraklaviküler sinir bloğu gerekebilir.',[['musc','kaslar'],['bone','klavikula'],['la','lokal anestezik']])},
    ftb:function(){return fig('Femoral üçgen bloğu',
      SK(40)+R(0,40,420,172,'t-fat')+E(220,74,104,26,'t-musc')+E(82,142,86,50,'t-musc2')+E(354,142,64,50,'t-musc')+R(20,188,170,24,'t-bone',12)+
      LA(198,116,40,12)+E(170,118,6,5,'t-nerve')+E(196,112,6,5,'t-nerve')+E(222,124,13,12,'t-vessel')+E(248,144,15,10,'t-vein')+
      T(220,78,'Sartorius','middle')+T(82,146,'Vastus medialis','middle')+T(354,146,'Adduktor longus','middle')+T(104,204,'Femur','middle')+T(196,104,'SS','end')+T(162,132,'VMS','middle')+T(238,122,'FA')+T(266,148,'FV')+
      T(8,215,'lateral')+T(412,215,'medial','end')+N(8,48,190,112),
      'Uyluk ortası ile kasık arasında, femoral üçgenin apeksine yakın enine şematik görünüm: sartoriusun medial kenarı adduktor longusun medial kenarıyla kesişmeden hemen önce. Safen sinir ve vastus medialis siniri femoral arterin lateralinde, sartorius altındadır. İğne lateralden girer; enjektat arterin lateralinde, sartorius altında yayılır. Büyük hacim femoral sinire ulaşıp kuadriseps güçsüzlüğü yapabilir.',[['musc','kaslar'],['bone','femur'],['nerve','safen sinir ve vastus medialis siniri'],['vessel','femoral arter'],['vein','femoral ven'],['la','lokal anestezik']])},
    gnb:function(){return fig('Genikülar sinir bloğu (superomedial hedef)',
      SK(40)+B(40,96,'t-musc','Vastus medialis')+R(0,96,420,50,'t-fat')+'<path d="M0 156 Q150 152 240 138 Q320 124 420 122 L420 220 L0 220Z" class="t-bone"/>'+
      LA(190,141,40,7)+E(176,142,5,4,'t-nerve')+E(200,140,6,5,'t-vessel')+
      T(176,130,'SMGS','end')+T(208,132,'SMGA')+T(90,190,'Femur metafizi','middle')+T(330,176,'Medial epikondil','middle')+
      T(8,215,'proksimal')+T(412,215,'distal','end')+N(40,40,186,140),
      'Dizin medialinde koronal şematik görünüm. Superomedial genikülar sinir, femurun metafiz-diyafiz bileşkesinde vastus medialis ile kemik arasında, superomedial genikülar arterin yanında seyreder; iğne kemik temasına kadar ilerler. Diğer hedefler: superolateral (vastus lateralis ile femur arası), inferolateral (lateral kollateral bağın derini, fibula başının üstü) ve inferomedial (medial kollateral bağın altı, tibia metafizi). Sinirler genellikle görülmez; arter ve kemik işaretleri kullanılır.',[['musc','vastus medialis'],['bone','femur'],['nerve','genikülar sinir'],['vessel','genikülar arter'],['la','lokal anestezik']])},
    fnb:function(){return fig('Femoral sinir bloğu',
      SK(40)+R(0,40,420,172,'t-fat')+LN(0,54,420,54,'fas')+E(110,142,104,44,'t-musc2')+LN(10,98,236,98,'fas')+E(350,160,62,30,'t-musc')+R(30,190,200,22,'t-bone',10)+
      LA(192,108,40,10)+E(190,108,17,7,'t-nerve')+E(256,90,14,13,'t-vessel')+E(300,96,18,12,'t-vein')+
      T(110,146,'İliopsoas','middle')+T(350,164,'Pektineus','middle')+T(130,204,'Femur başı','middle')+T(60,50,'Fasya lata','middle')+T(40,94,'Fasya iliaka','middle')+T(190,126,'FS','middle')+T(256,72,'FA','middle')+T(300,80,'FV','middle')+
      T(8,215,'lateral')+T(412,215,'medial','end')+N(8,64,172,108),
      'İnguinal kıvrımda enine şematik görünüm. Femoral sinir fasya iliakanın altında, iliopsoasın üzerinde ve femoral arterin lateralindedir; arter ve ven fasya iliakanın üstünde kalır. İğne lateralden in-plane girer; enjektat fasya iliakanın altında siniri sarar. Kuadriseps güçsüzlüğü ve düşme riski vardır.',[['musc','kaslar'],['bone','femur başı'],['nerve','femoral sinir'],['vessel','femoral arter'],['vein','femoral ven'],['la','lokal anestezik']])},
    ankle:function(){return fig('Ayak bileği bloğu: tibial sinir',
      SK(36)+R(0,36,420,176,'t-fat')+LN(70,62,390,62,'fas')+E(30,132,72,72,'t-bone')+E(112,94,13,10,'t-lig')+E(148,90,11,9,'t-lig')+E(262,164,74,30,'t-musc2')+E(372,104,40,20,'t-lig')+
      LA(232,100,36,14)+E(188,96,6,5,'t-vein')+E(206,92,8,8,'t-vessel')+E(224,96,6,5,'t-vein')+E(240,106,12,9,'t-nerve')+
      T(40,140,'Medial malleol','middle')+T(112,80,'TP','middle')+T(148,76,'FDL','middle')+T(206,78,'PTA','middle')+T(254,112,'TS')+T(262,168,'FHL','middle')+T(372,108,'Aşil','middle')+T(300,58,'Fleksör retinakulum','middle')+
      T(8,215,'anterior')+T(412,215,'posterior','end')+N(412,40,250,102),
      'Medial malleol ile Aşil tendonu arasında enine şematik görünüm. Tibial sinir fleksör retinakulumun derininde, posterior tibial arter ve venlerin posteriorundadır; en büyük ve en geç etki eden sinir olduğu için önce bloke edilir. Diğer dört sinir: derin peroneal (ekstansör retinakulum düzeyinde anterior tibial arterin yanında), yüzeyel peroneal (lateral malleolün 5–10 cm proksimalinde, krural fasyadan çıkmadan), sural (lateral malleol ile Aşil arasında, küçük safen venin yanında), safen (medial malleolün proksimalinde, büyük safen venin yanında).',[['bone','medial malleol'],['lig','tendonlar'],['musc','FHL kası'],['nerve','tibial sinir'],['vessel','posterior tibial arter'],['vein','venler'],['la','lokal anestezik']])},
    tlip:function(){return fig('Torakolomber interfasyal plan (TLIP) bloğu',
      SK(36)+LN(0,46,420,46,'fas')+R(0,46,28,150,'t-bone',8)+E(86,122,58,56,'t-musc')+E(212,114,66,54,'t-musc2')+E(344,106,70,46,'t-musc')+'<path d="M0 196 Q120 190 200 180 Q320 172 420 180 L420 220 L0 220Z" class="t-bone"/>'+
      LA(146,118,9,42)+E(146,166,5,4,'t-nerve')+
      T(14,120,'SP','middle')+T(86,126,'Multifidus','middle')+T(212,118,'Longissimus','middle')+T(344,110,'İliokostalis','middle')+T(158,170,'DR')+T(300,42,'Torakolomber fasya','middle')+T(200,204,'Lamina / transvers çıkıntı','middle')+
      T(30,215,'medial (orta hat)')+T(412,215,'lateral','end')+N(412,40,152,116),
      'L3 düzeyinde, orta hattın 2–3 cm lateralinde enine şematik görünüm. Klasik yaklaşımda enjektat multifidus ile longissimus arasına, modifiye (lateral) yaklaşımda longissimus ile iliokostalis arasına verilir; hedef dorsal ramilerdir. İğne lateralden mediale ilerler; orta hat insizyonunda blok bilateral yapılır.',[['bone','spinöz çıkıntı ve lamina'],['musc','paraspinal kaslar'],['nerve','dorsal rami'],['la','lokal anestezik']])}
  };
  for(var _k4 in ANIM4)ANIM[_k4]=ANIM4[_k4];

  /* ---------- Seçiciler ---------- */
  var acgSel=$('acg');
  ACG.forEach(function(a){
    if(a.g){var og=document.createElement('optgroup');og.label=a.g;acgSel.appendChild(og);return}
    var o=document.createElement('option');o.value=a.id;o.textContent=a.label;
    (a.id==='none'?acgSel:acgSel.lastChild.tagName==='OPTGROUP'?acgSel.lastChild:acgSel).appendChild(o);
  });
  function current(){var id=acgSel.value;return ACG.filter(function(a){return a.id===id})[0]}
  function acgFor(a){var c=$('crcl').value;var renal=a.renal&&(a.renalLt50?(c!=='ge50'):(c==='lt30'));return {h:renal&&a.hRenal?a.hRenal:a.h,renal:renal}}
  function procList(){var r=$('reg').value,p=$('appr').value;return Object.keys(PROC).filter(function(k){return PROC[k].reg===r&&(PROC[k].ap===p||PROC[k].ap==='both')})}
  function fillProc(){
    var sel=$('proc'),l=procList();sel.textContent='';
    if(!l.length){var o=document.createElement('option');o.value='';o.textContent='Özet henüz eklenmedi';sel.appendChild(o);return}
    l.forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=PROC[k].name;sel.appendChild(o)});
  }

  /* ---------- Çıktı 1: blok seçenekleri ---------- */
  function hspan(r){return r.h[0]===r.h[1]?r.h[0]+' saat':r.h[0]+'–'+r.h[1]+' saat'}
  function acLine(it,a){
    if(!a||a.id==='none')return '';
    if(it.tech==='infil'||it.tech==='other')return '<div class="ac"><b>Antitrombotik:</b> kaynakta bu seçenek için kural verilmemiş.</div>';
    var r=acgFor(a);
    if(it.tech==='neuraxial')return '<div class="ac"><b>Antitrombotik ('+esc(a.label)+'):</b> nöroaksiyel için '+(a.h[1]===0?'ek bekleme yok':hspan(r))+'. '+(a.id==='fon_hi'?'Önerilmez.':'')+'</div>';
    return '<div class="ac"><b>Antitrombotik ('+esc(a.label)+'):</b> derin blok ise nöroaksiyel aralık ('+(a.h[1]===0?'ek bekleme yok':hspan(r))+'); yüzeysel blok ise: '+esc(SUP[a.cls])+' <span class="flag">Bu bloğun derin/yüzeysel sınıfı kaynak özetinde belirtilmedi; ESAIC/ESRA tablosundan doğrulayın.</span></div>';
  }
  function cmLines(it){
    var o='';
    if(on('osa')&&it.opi)o+='<div class="cm"><b>Uyku apnesi:</b> nöroaksiyel opioidin yararı, rostral yayılımla solunum depresyonu riskine karşı tartılmalı; sistemik opioid için sürekli arka plan infüzyonundan kaçının (ASA 2014).</div>';
    if(on('as')&&it.tech==='neuraxial')o+='<div class="cm"><b>Aort stenozu:</b> nöroaksiyel için mutlak kontrendikasyon sayılmaz; hipotansiyona hazırlıklı olun, ağır veya semptomatik hastada dikkatli seçim ve invaziv izlem (NYSORA, ikincil kaynak).</div>';
    if(on('copd')&&(it.tech==='periph'||it.tech==='plane')&&/interskalen|supraklav|infraklav|kostoklav|aksiller/i.test(it.n))o+='<div class="cm"><b>KOAH:</b> diyafram tutulumu riskini düşünün.</div>';
    return o;
  }
  var openAnim={};
  function evOf(it){
    if(it.ev)return {t:it.ev,r:it.er==null?4:it.er};
    var m=/derece ([A-D])\b/.exec(it.n+' '+it.w);
    if(m){var L=m[1];return {t:'PROSPECT derece '+L,r:'ABCD'.indexOf(L)}}
    return {t:'Derece verilmemiş',r:4};
  }
  function item(o,a,pk,top){
    var it=o.it,key=pk+':'+o.ix,ak=it.anim||[],uk=usgKeys(it.n).filter(function(k){return ak.indexOf(k)<0}),hasA=(ak.length||uk.length)&&(it.s==='rec'||it.s==='opt'),bl=(ak.length||uk.some(function(k){return ANIM[k]}))?'Animasyonu':'USG görünümünü';
    return '<li class="opt"><span class="chip '+it.s+'">'+ST[it.s]+'</span><div><span class="nm">'+esc(it.n)+'</span><span class="tag">'+TECH[it.tech]+'</span>'+(top?'<span class="chip top">en güçlü kanıt</span>':'')+'</div><div class="ev">Kanıt düzeyi: '+esc(o.ev.t)+'</div><div class="why">'+esc(it.w)+'</div>'+
      (it.s==='rec'||it.s==='opt'?acLine(it,a):'')+cmLines(it)+
      (hasA?'<button type="button" class="play" data-k="'+key+'" aria-expanded="'+(openAnim[key]?'true':'false')+'">'+(openAnim[key]?bl+' gizle':bl+' göster')+'</button>'+(openAnim[key]?'<div class="anim">'+ak.map(function(k){return ANIM[k]()+usgLinks(k)}).concat(uk.map(function(k){return (ANIM[k]?ANIM[k]():'')+usgLinks(k)})).join('')+'</div>':''):'')+'</li>';
  }
  function group(list,title,pk,a){
    if(!list.length)return '';
    var recs=list.filter(function(o){return o.it.s==='rec'});
    var best=recs.length?Math.min.apply(null,recs.map(function(o){return o.ev.r})):9;
    return '<h3 class="grp">'+title+'</h3>'+(recs.length&&best===4?'<p class="src" style="margin:0 0 8px">Bu kaynak özetinde kanıt derecesi verilmemiş; sıra kaynaktaki sıradır.</p>':'')+
      '<ul class="opt-list">'+list.map(function(o){return item(o,a,pk,o.it.s==='rec'&&best<4&&o.ev.r===best)}).join('')+'</ul>';
  }
  function renderBlock(){
    var k=$('proc').value, a=current(), el=$('p-block');
    if(!k||!PROC[k]){
      var ek=$('reg').value+'-'+$('appr').value, msg=EMPTY[ek]||'Bu kesi yeri ve yaklaşım için PROSPECT özeti henüz eklenmedi.';
      var avail=Object.keys(PROC).map(function(x){return PROC[x].name+' ('+(PROC[x].ap==='open'?'açık':PROC[x].ap==='both'?'açık/kapalı':'kapalı')+')'}).join(', ');
      el.innerHTML='<h2>Blok seçenekleri</h2><p class="empty">'+esc(msg)+'</p><p class="src" style="margin:8px 0 0">Eklenen cerrahiler: '+esc(avail)+'. Antitrombotik ve hasta faktörü bölümleri cerrahiden bağımsız çalışır.</p>';
      return;
    }
    var s=PROC[k], all=s.items.map(function(i,ix){return {it:i,ix:ix,ev:evOf(i)}});
    var good=all.filter(function(o){return o.it.s==='rec'||o.it.s==='opt'}).sort(function(x,y){
      var sx=x.it.s==='rec'?0:1, sy=y.it.s==='rec'?0:1; return sx-sy||x.ev.r-y.ev.r||x.ix-y.ix});
    var rest=all.filter(function(o){return !(o.it.s==='rec'||o.it.s==='opt')});
    var nx=good.filter(function(o){return o.it.tech==='neuraxial'}), pr=good.filter(function(o){return o.it.tech!=='neuraxial'});
    el.innerHTML='<div class="sec-h"><h2>Blok seçenekleri: '+esc(s.name)+'</h2><span class="src">'+src(PRO[s.src])+(s.src2?' · '+src(PRO[s.src2]):'')+(s.srcx||[]).map(function(k){return ' · '+src(PRO[k])}).join('')+'</span></div>'+
      '<p class="src" style="margin:0">Sıralama: önce kaynağın önerisi, sonra kaynağın kendi kanıt düzeyi. Farklı ölçekler (A–D; yüksek/orta kanıt ve güçlü/zayıf öneri; AAHKS güçlü/orta/sınırlı) yaklaşık eşlenmiştir.</p>'+
      group(nx,'Nöroaksiyel seçenekler',k,a)+group(pr,'Periferik blok, plan bloğu ve infiltrasyon',k,a)+
      (!good.length?'<p class="empty">Bu cerrahi için önerilen veya isteğe bağlı bir seçenek yok.</p>':'')+
      (rest.length?'<details style="margin-top:12px"><summary>Önerilmeyen veya değerlendirilmeyen ('+rest.length+')</summary><ul class="opt-list">'+rest.map(function(o){return item(o,a,k,false)}).join('')+'</ul></details>':'');
  }

  /* ---------- Çıktı 2: antitrombotik ---------- */
  var DER=D.DER;
  function derHtml(a){var d=DER[a.id];if(!d)return '';
    return '<dt>Çıkarım önerisi</dt><dd><span class="chip na">'+esc(d.l)+'</span> <b>'+esc(d.n)+'</b><br>'+esc(d.m)+'<br><span class="src">Kaynakta doğrudan değer yok; atıflı komşu değerlerin ortalaması, kanıt etiketi değildir. Hekim doğrulaması şart. Kaynak: '+esc(d.s)+'</span></dd>'}
  function renderAcg(){
    var a=current(), el=$('p-acg');
    if(!a||a.id==='none'){el.innerHTML='<h2>Antitrombotik rehberi</h2><p class="empty">İlaç seçildiğinde nöroaksiyel ve blok için aralıklar burada görünür.</p>';return}
    var r=acgFor(a), last=$('last').value, when='';
    if(last){var d=new Date(last);if(!isNaN(d)){var e1=new Date(d.getTime()+r.h[0]*36e5),e2=new Date(d.getTime()+r.h[1]*36e5);
      when='<dt>En erken zaman</dt><dd><span class="big">'+(r.h[0]===r.h[1]?fmt(e1):fmt(e1)+' – '+fmt(e2))+'</span><br><span class="src">Yalnızca zaman koşulu. Laboratuvar ve klinik koşullar ayrıca sağlanmalıdır.</span></dd>'}}
    el.innerHTML='<div class="sec-h"><h2>Antitrombotik: '+esc(a.label)+'</h2><span class="src">'+src(ESAIC)+'</span></div>'+
      '<dl class="kv"><dt>Nöroaksiyel</dt><dd><span class="big">'+(a.h[1]===0?'0 saat':hspan(r))+'</span><br>'+esc(a.txt)+'</dd>'+a5html(a)+derHtml(a)+
      (r.renal?'<dt>Böbrek uyarısı</dt><dd>'+esc(a.renal)+'</dd>':(a.renal?'<dt>Böbrek</dt><dd class="src">Seçili klirenste ek ayar yok. '+esc(a.renal)+'</dd>':''))+
      '<dt>Derin blok</dt><dd>'+esc(NX_COMMON)+'</dd><dt>Yüzeysel blok</dt><dd>'+esc(SUP[a.cls])+'</dd>'+
      '<dt>Girişim sonrası</dt><dd>'+esc(a.after)+'</dd><dt>Kateter</dt><dd>'+esc(CATH)+'</dd>'+when+'</dl>'+
      renalHtml(a)+'<details style="margin-top:12px"><summary>İzlem ve ek notlar (ESAIC/ESRA)</summary><ul class="notes" style="margin-top:10px">'+MONITOR.map(function(m){return '<li>'+esc(m)+'</li>'}).join('')+'</ul></details>'+
      '<details style="margin-top:12px"><summary>Olgu serileri ve gözlemsel veriler (ASRA 5. baskı metninde anılanlar)</summary><ul class="notes" style="margin-top:10px">'+CASES.map(function(c){return '<li><span class="chip '+EVCH[c[1]]+'">'+c[1]+'</span> '+esc(c[0])+' <span class="src">('+esc(c[2])+')</span></li>'}).join('')+'</ul><p class="src" style="margin:10px 0 0">'+esc(EV_RULE)+' Kaynak: '+src(ASRA5SRC)+'. Çalışmaların kendisi okunmadı; ASRA metninin aktardığı biçimde.</p></details>';
  }

  /* ---------- Çıktı 3: hasta faktörleri ---------- */
  function renderCom(){
    var ids=COMIDS.filter(on), el=$('p-comorb');
    if(!ids.length){el.innerHTML='<h2>Hasta faktörleri</h2><p class="empty">Soldan bir faktör seçildiğinde kaynaklı uyarılar burada görünür. Kronik böbrek hastalığı kreatinin klirensi alanıyla işlenir. Enfeksiyon/sepsis, kanama bozukluğu ve obezite için doğrulanmış kural henüz eklenmedi.</p>';return}
    el.innerHTML='<div class="sec-h"><h2>Hasta faktörleri</h2></div><ul class="notes">'+ids.map(function(i){var c=COM[i];
      return '<li><b>'+esc(c.n)+'</b> <span class="chip na">'+(c.scope==='nx'?'nöroaksiyel':'tüm bloklar')+'</span><br>'+esc(c.t)+(c.src?'<br><span class="src">Kaynak: '+src(c.src)+'</span>':'')+'</li>'}).join('')+'</ul>';
  }
  function renderSrc(){
    var k=$('proc').value, list=[ESAIC,ASRA_NEURO];
    if(k&&PROC[k]){(PROC[k].srcx||[]).forEach(function(x){list.unshift(PRO[x])});if(PROC[k].src2)list.unshift(PRO[PROC[k].src2]);list.unshift(PRO[PROC[k].src])}
    if(current()&&current().id!=='none')list.push(ASRA5SRC);list.push(EGY);
    COMIDS.filter(on).forEach(function(i){var s=COM[i].src;if(s&&list.indexOf(s)<0)list.push(s)});
    $('srclist').innerHTML=list.map(function(o){return '<li>'+src(o)+'</li>'}).join('');
  }
  function renderFoot(){$('p-foot').innerHTML='<h2>Dipnotlar: ESAIC/ESRA 2022 ile ASRA 5. baskı farkları</h2><ol class="notes" style="margin-top:10px">'+FOOT.map(function(f){return '<li>'+esc(f[1])+'</li>'}).join('')+'</ol><p class="src" style="margin:10px 0 0">ASRA tarafı: '+src(ASRA5SRC)+' ve okunan uyarlama: '+src(EGY)+'. ESAIC/ESRA tarafı: '+src(ESAIC)+'. Terminoloji değişikliği için: '+src(ESRANEWS)+'.</p>'}
  function renderOrig(){
    var L=function(o,n){return '<li>'+(n?'<span class="src">'+esc(n)+'</span><br>':'')+src(o)+'</li>'};
    var pro=Object.keys(PRO).map(function(k){return L(PRO[k])}).join('');
    var ren=RENAL.map(function(r){return L({t:r.a,u:'https://doi.org/'+r.d})}).join('');
    $('p-orig').innerHTML='<h2>Orijinal metinler</h2><p class="src" style="margin:6px 0 10px">Kılavuz metinleri telif nedeniyle sayfaya kopyalanmadı; aşağıdaki bağlantılar yayıncıya veya kurumun kendi barındırmasına gider. Erişim koşullarını (açık erişim veya abonelik) doğrulamadım.</p>'+
      '<h3 class="grp">Antitrombotik ve rejyonel anestezi</h3><ul class="notes">'+
      L(ESAIC,'ESAIC/ESRA 2022, PubMed kaydı')+
      L({t:'ESAIC/ESRA 2022 tam metin PDF (İsveç Anestezi Derneği barındırması)',u:'https://sfai.se/wp-content/uploads/2022/12/Regional_anaesthesia_in_patients_on_antithrombotic.4-1.pdf'})+
      L(ASRA5SRC,'ASRA 5. baskı, PubMed kaydı; bu oturumda tam metne ulaşılamadı')+
      L({t:'ASRA 5. baskı, DOI (BMJ / Reg Anesth Pain Med)',u:'https://doi.org/10.1136/rapm-2024-105766'})+
      L({t:'ASRA 5. baskı, ASRA duyuru sayfası',u:'https://asra.com/news-publications/asra-updates/blog-landing/guidelines/2025/01/31/regional-anesthesia-in-the-patient-receiving-antithrombotic-or-thrombolytic-therapy-american-society-of-regional-anesthesia-and-pain-medicine-evidence-based-guidelines-(fifth-edition)'})+
      L(EGY,'ASRA sayılarının okunduğu uyarlama (birincil metin değil)')+
      L(ASRA_NEURO)+L(ASA_OSA)+'</ul>'+
      '<h3 class="grp">Prosedüre özgü analjezi ve ortopedi kılavuzları</h3><ul class="notes">'+pro+'</ul>'+
      '<h3 class="grp">DMAH ve böbrek (PubMed)</h3><ul class="notes">'+ren+'</ul>'+
      '<h3 class="grp">İkincil kaynaklar</h3><ul class="notes">'+L(NYS_SYS)+L(NYS_AS)+L(GIST)+L(NYSDOAC)+L(PMCLLM)+L(ESRANEWS)+'</ul>';
  }

  /* ---------- Yeni nesil fasiyal plan blokları (Tulgar / Çiftçi yayınları) ---------- */
  var NEWB=D.NEWB;
  var GRK=D.GRK;
  var GRKSRC=D.GRKSRC;
  var ULSRC=D.ULSRC;
  Object.keys(ULSRC).forEach(function(k){PRO[k]={t:ULSRC[k][0],u:ULSRC[k][1]}});
  Object.keys(GRKSRC).forEach(function(k){PRO[k]={t:GRKSRC[k][0],u:GRKSRC[k][1]}});
  var TFB=D.TFB;
  var TFBSRC=D.TFBSRC;
  Object.keys(TFBSRC).forEach(function(k){PRO[k]={t:TFBSRC[k][0],u:TFBSRC[k][1]}});
  var PGB=D.PGB;
  var PGBSRC=D.PGBSRC;
  Object.keys(PGBSRC).forEach(function(k){PRO[k]={t:PGBSRC[k][0],u:PGBSRC[k][1]}});
  var USGIMG=D.USGIMG;
  var USGGOOG=D.USGGOOG;
  USGIMG=USGIMG.concat([["Brakiyal pleksus: interskalen, supraklaviküler, infraklaviküler, aksiller", [["Paravertebral + interskalen blok, mastektomi (olgu serisi, PMC açık erişim)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC9258351/"], ["Paravertebral + interskalen blok, mastektomi (olgu, PMC açık erişim)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC10591238/"], ["Uyanık mastektomi: paravertebral + pekto-interkostal + supraklaviküler blok (olgu, PMC açık erişim)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12819576/"], ["Aksiller blok ve diğer teknikler, distal üst ekstremite (derleme, PMC açık erişim)", "https://pmc.ncbi.nlm.nih.gov/articles/PMC11173314/"]]], ["Suprascapular sinir bloğu", [["Omuz cerrahisinde suprascapular blok: Gürkan ve ark. çalışmaları (kaynak makaleler panelde)", "https://pubmed.ncbi.nlm.nih.gov/?term=suprascapular+nerve+block+Gurkan+Y%5BAuthor%5D"]]]]);
  var USGFIG=D.USGFIG;
  var USGMAP={esp:'ESP (erector spinae plan)',tap:'TAP / subkostal TAP',pvb:'Romboid interkostal blok (RIB) / paravertebral',fib:'Fasya iliaka bloğu',acb:'Aduktör kanal bloğu',spinal:'Spinal ve epidural (nöroaksiyel)',epidural:'Spinal ve epidural (nöroaksiyel)'};
  Object.keys(USGFIG).forEach(function(k){
    var name=USGMAP[k],row=USGIMG.filter(function(b){return b[0]===name})[0];
    if(!row){row=[name,[]];USGIMG.push(row)}
    USGFIG[k].forEach(function(l){if(!row[1].some(function(x){return x[1]===l[1]}))row[1].unshift(['USG şekli · '+l[0],l[1]])});
  });
  /* ---------- Şematik USG benzetimleri (özgün çizim, gerçek görüntü değil) ---------- */
  var USGF='<filter id="usgsp" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 -.7"/></filter><filter id="usgbl"><feGaussianBlur stdDeviation="1.4"/></filter>';
  function sg(v){return 'rgb('+v+','+v+','+v+')'}
  function sB(y1,y2,v){return '<rect x="0" y="'+y1+'" width="320" height="'+(y2-y1)+'" fill="'+sg(v)+'"/>'}
  function sP(d,v){return '<path d="'+d+'" fill="'+sg(v)+'"/>'}
  function sL(d,w,v){return '<path d="'+d+'" fill="none" stroke="'+sg(v)+'" stroke-width="'+w+'" stroke-linecap="round"/>'}
  function sT(x,y,s,a){return '<text x="'+x+'" y="'+y+'"'+(a?' text-anchor="'+a+'"':'')+' fill="#ffe680" font-size="9" font-weight="600" font-family="Inter,sans-serif" paint-order="stroke" stroke="#000" stroke-width="2.5" stroke-linejoin="round">'+s+'</text>'}
  function sN(x1,y1,x2,y2){var L=Math.round(Math.hypot(x2-x1,y2-y1));return '<line class="und" x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#fafafa" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="'+L+'" style="--len:'+L+'"/><circle class="undt" cx="'+x2+'" cy="'+y2+'" r="2.4" fill="#fff"/>'}
  function sLA(d){return '<path class="ula" d="'+d+'" fill="#030303" stroke="'+sg(150)+'" stroke-width=".8"/>'}
  function sSk(){return sL('M0 5H320',3,205)}
  function sStr(y1,y2,v){var s='';for(var y=y1+6;y<y2-2;y+=7)s+=sL('M0 '+y+'Q80 '+(y-2)+' 160 '+y+'T320 '+y,.7,v);return s}
  function sNerve(cx,cy,rx,ry){var s='<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+sg(185)+'"/>';for(var i=-1;i<=1;i++)for(var j=-1;j<=1;j+=2)s+='<circle cx="'+(cx+i*rx*.45)+'" cy="'+(cy+j*ry*.35)+'" r="'+Math.min(rx,ry)*.22+'" fill="'+sg(45)+'"/>';return s}
  function sVes(cx,cy,rx,ry,enh){return (enh?'<rect x="'+(cx-rx)+'" y="'+(cy+ry)+'" width="'+2*rx+'" height="60" fill="#fff" opacity=".07"/>':'')+'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#040404" stroke="'+sg(200)+'" stroke-width="1.2"/>'}
  function sBone(d,sh){return '<path d="'+sh+'" fill="#010101"/>'+sL(d,4,238)}
  var USGTK=(function(){var s='';for(var y=20;y<220;y+=20)s+='<circle cx="314" cy="'+y+'" r="'+(y%40?1:1.6)+'" fill="#bbb"/>';return s})();
  var NEURAX={
    a:sB(0,96,62)+sStr(10,92,90)+sL('M0 40Q160 34 320 42',1.2,150)+sB(96,220,20)+sL('M0 124H320',3.5,215)+'<rect x="0" y="127" width="320" height="22" fill="#030303"/>'+sL('M0 152H320',4,225),
    lam:(function(){var s='';[12,100,188,276].forEach(function(x){s+=sBone('M'+x+' 110L'+(x+44)+' 95','M'+x+' 110L'+(x+44)+' 95L'+(x+44)+' 220L'+x+' 220Z')});return s})(),
    clip:'M128 0H192L320 196Q160 236 0 196Z'
  };
  var USGS={
    esp:{t:'ESP bloğu, T4 parasagital',c:'Lineer prob, parasagital; kranial solda. İğne in-plane kaudalden, ucu transvers çıkıntıya; LA erector spinae kası ile çıkıntı arasında kranio-kaudal yayılır.',
      a:sB(6,22,48)+sB(22,48,78)+sB(48,72,68)+sB(72,128,84)+sStr(72,128,108)+sB(128,220,22)+[40,150,260].map(function(x){return sBone('M'+(x-38)+' 138Q'+x+' 119 '+(x+38)+' 138','M'+(x-38)+' 138Q'+x+' 119 '+(x+38)+' 138L'+(x+38)+' 220L'+(x-38)+' 220Z')}).join(''),
      b:sSk()+sL('M0 22H320',1.4,170)+sL('M0 48H320',1.6,180)+sL('M0 72H320',1.8,185)+sLA('M92 129Q150 106 208 129Q150 133 92 129Z')+sN(305,10,160,121),
      l:sT(6,38,'Trapez')+sT(6,63,'Romboid')+sT(6,100,'Erector spinae')+sT(150,160,'Transvers çıkıntı','middle')+sT(150,111,'LA','middle')+sT(300,26,'İğne','end')},
    tap:{t:'TAP bloğu, orta aksiller hat',c:'Lineer prob, transvers; medial solda. İğne in-plane medialden; LA iç oblik ile transversus abdominis arasındaki fasya planında mercek biçiminde yayılır.',
      a:sB(6,40,42)+sL('M0 18Q100 22 200 16T320 20',.8,120)+sL('M0 30Q120 26 220 32T320 28',.8,110)+sB(40,70,80)+sStr(40,70,105)+sB(70,108,90)+sStr(70,108,112)+sB(108,128,66)+sStr(108,128,92)+sB(130,220,26)+sL('M0 178Q40 168 80 178T160 178T240 178T320 178',3,175)+sL('M0 196Q40 188 80 196T160 196T240 196T320 196',1,80),
      b:sSk()+sL('M0 40H320',1.6,185)+sL('M0 70H320',1.6,185)+sL('M0 108H320',1.8,190)+sL('M0 130H320',2.2,205)+sLA('M95 108Q172 92 250 108Q172 118 95 108Z')+sN(8,8,172,104),
      l:sT(312,30,'Cilt altı yağ','end')+sT(312,58,'Dış oblik','end')+sT(312,92,'İç oblik','end')+sT(312,122,'Transversus abd.','end')+sT(312,143,'Periton','end')+sT(312,172,'Barsak','end')+sT(172,100,'LA','middle')},
    pvb:{t:'Torasik paravertebral blok, transvers',c:'Lineer prob, transvers interkostal; medial solda. İğne in-plane lateralden, iç interkostal membranı geçer; LA paravertebral boşluğu doldurup plevrayı aşağı iter.',
      a:sB(6,42,74)+sStr(6,42,98)+sB(42,98,60)+sStr(42,98,84)+sB(98,220,24)+sP('M70 100L320 130L320 166L200 160L70 150Z',58)+sBone('M0 92Q40 86 72 98','M0 92Q40 86 72 98L72 220L0 220Z')+sL('M84 196H320',1,90)+sL('M84 212H320',.8,70),
      b:sSk()+sL('M0 42H320',1.4,170)+sL('M72 100L320 130',1.6,190)+sLA('M73 104L188 118Q176 150 73 152Z')+sL('M72 156Q150 172 200 162L320 168',3.2,225)+sN(312,28,118,124),
      l:sT(6,30,'Trapez / romboid')+sT(150,70,'Dış interkostal kas','middle')+sT(30,112,'TP','middle')+sT(250,124,'İç interkostal membran','middle')+sT(110,136,'LA','middle')+sT(250,182,'Plevra (itildi)','middle')+sT(250,206,'Akciğer','middle')},
    fib:{t:'Fasya iliaka bloğu, inguinal transvers',c:'Lineer prob, transvers inguinal; lateral solda. İğne in-plane lateralden; LA fasya iliaka altında iliyak kas üzerinde mediale, femoral sinire doğru yayılır.',
      a:sB(6,30,46)+sP('M0 30L130 30Q100 58 0 70Z',84)+sB(72,220,74)+sP('M0 72Q120 58 210 70Q260 78 320 76L320 30L130 30Q100 58 0 70Z',60)+sStr(80,170,96)+sBone('M0 186Q140 160 260 192L320 200','M0 186Q140 160 260 192L320 200L320 220L0 220Z'),
      b:sSk()+sL('M0 30H320',1.4,170)+sL('M0 72Q120 58 210 70Q260 78 320 76',2.6,218)+sLA('M58 74Q120 60 188 72Q120 90 58 80Z')+sNerve(212,84,14,9)+sVes(262,56,15,13,1)+'<ellipse cx="300" cy="62" rx="12" ry="9" fill="#050505" stroke="'+sg(150)+'" stroke-width=".8"/>'+sN(6,14,118,72),
      l:sT(8,48,'Sartorius')+sT(30,120,'İliyak kas')+sT(150,56,'Fasya iliaka','middle')+sT(110,84,'LA','middle')+sT(212,104,'FS','middle')+sT(262,40,'FA','middle')+sT(300,82,'FV','middle')+sT(120,200,'İlium','middle')},
    acb:{t:'Aduktör kanal bloğu, orta uyluk',c:'Lineer prob, transvers orta uyluk; lateral solda. İğne in-plane lateralden sartorius altına; LA femoral arter çevresinde, safen sinirin bulunduğu kanalda yayılır.',
      a:sB(6,26,46)+sB(26,220,70)+sP('M0 40Q60 90 120 150L0 170Z',82)+sP('M220 60Q260 120 320 120L320 26L250 26Z',76)+sP('M58 28Q160 10 262 28Q240 72 160 80Q92 74 58 28Z',88)+sStr(30,74,104)+sBone('M0 178Q50 152 112 172','M0 178Q50 152 112 172L112 220L0 220Z'),
      b:sSk()+sL('M58 28Q160 10 262 28Q240 72 160 80Q92 74 58 28',1.6,190)+sL('M100 80Q130 110 150 140',1.2,170)+sLA('M128 84Q165 72 200 90Q206 118 166 126Q126 120 128 84Z')+sVes(166,101,13,12,1)+'<ellipse cx="192" cy="124" rx="11" ry="7" fill="#050505" stroke="'+sg(150)+'" stroke-width=".8"/>'+'<circle cx="142" cy="92" r="4" fill="'+sg(200)+'"/>'+sN(8,24,140,90),
      l:sT(160,44,'Sartorius','middle')+sT(10,130,'Vastus medialis')+sT(310,100,'Adduktor longus','end')+sT(166,104,'FA','middle')+sT(214,140,'FV','middle')+sT(128,106,'SS','end')+sT(50,196,'Femur','middle')},
    spinal:{t:'Spinal, paramedian sagital oblik (L3–L4)',c:'Konveks prob, paramedian sagital oblik; kranial solda. Laminalar arası pencerede posterior kompleks (ligamentum flavum + dura) ve anterior kompleks görülür; spinal iğne posterior kompleksi geçip intratekal boşluğa (BOS, anekoik) ulaşır.',clip:NEURAX.clip,
      a:NEURAX.a+NEURAX.lam,b:sN(128,2,170,140),
      l:sT(60,30,'Paraspinal kaslar','middle')+sT(122,92,'Lamina','middle')+sT(172,120,'Posterior kompleks','start')+sT(250,142,'İntratekal (BOS)','middle')+sT(250,168,'Anterior kompleks','middle')},
    epidural:{t:'Epidural, paramedian sagital oblik (lomber)',c:'Konveks prob, paramedian sagital oblik; kranial solda. Ön tarama ile orta hat, derinlik ve laminalar arası pencere belirlenir; Tuohy iğnesi direnç kaybıyla posterior kompleksin hemen önündeki epidural aralıkta durur.',clip:NEURAX.clip,
      a:NEURAX.a+NEURAX.lam,b:sN(128,2,166,122),
      l:sT(60,30,'Paraspinal kaslar','middle')+sT(122,92,'Lamina','middle')+sT(172,118,'Epidural aralık / LF','start')+sT(250,142,'İntratekal (BOS)','middle')+sT(250,168,'Anterior kompleks','middle')}
  };
  function usgSim(k){if(CZ[k])return czUs(CZ[k]);var s=USGS[k];if(!s)return '';var cp=s.clip?' clip-path="url(#usgc-'+k+')"':'';
    return '<div class="fig"><p class="ft">USG benzetimi · '+s.t+'</p><svg class="usgsv" viewBox="0 0 320 220" role="img" aria-label="'+s.t+', USG benzetimi: iğne ilerleyişi ve lokal anestezik yayılımı"><defs>'+USGF+(s.clip?'<clipPath id="usgc-'+k+'"><path d="'+s.clip+'"/></clipPath>':'')+'</defs><rect width="320" height="220" fill="#000"/><g'+cp+'><g filter="url(#usgbl)">'+s.a+'</g><rect width="320" height="220" filter="url(#usgsp)" opacity=".5"/>'+s.b+'</g>'+USGTK+s.l+'</svg><p class="fc">'+s.c+' Şematik benzetimdir, gerçek hasta görüntüsü değildir.</p></div>'}
  function sR(cx,cy,r){return '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#151515" stroke="'+sg(205)+'" stroke-width="1.6"/>'}
  function sVn(cx,cy,rx,ry){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="#060606" stroke="'+sg(140)+'" stroke-width=".8"/>'}
  function sRibs(xs,y,w){return xs.map(function(x){return sBone('M'+(x-w)+' '+(y+4)+'Q'+x+' '+(y-8)+' '+(x+w)+' '+(y+4),'M'+(x-w)+' '+(y+4)+'Q'+x+' '+(y-8)+' '+(x+w)+' '+(y+4)+'L'+(x+w)+' 220L'+(x-w)+' 220Z')}).join('')}
  function sCart(cx,cy,rx,ry){return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+sg(38)+'" stroke="'+sg(205)+'" stroke-width="1.8"/>'}
  function sLen(x1,x2,y,h){var m=(x1+x2)/2;return sLA('M'+x1+' '+y+'Q'+m+' '+(y-h)+' '+x2+' '+y+'Q'+m+' '+(y+h*.45)+' '+x1+' '+y+'Z')}
  var QLB={
    a:sB(0,220,52)+sB(6,22,44)+sP('M0 22L120 22Q160 34 176 56L0 48Z',82)+sP('M0 48L176 56Q150 64 0 76Z',90)+sP('M0 76Q150 64 176 60Q150 82 0 98Z',70)+sP('M150 22L320 22L320 52Q240 46 170 40Z',78)+'<ellipse cx="240" cy="102" rx="60" ry="30" fill="'+sg(86)+'"/>'+'<ellipse cx="236" cy="168" rx="52" ry="28" fill="'+sg(72)+'"/>'+sP('M290 54L320 54L320 136Q298 124 290 54Z',80)+'<ellipse cx="86" cy="164" rx="62" ry="26" fill="'+sg(60)+'"/>'+sBone('M262 146L320 138','M262 146L320 138L320 220L262 220Z'),
    b:sSk()+sL('M176 58Q200 62 232 72',1.6,200)+'<ellipse cx="240" cy="102" rx="60" ry="30" fill="none" stroke="'+sg(180)+'" stroke-width="1.3"/>'+sL('M0 100Q150 84 184 96Q190 130 196 160',1.4,185)+'<ellipse cx="86" cy="164" rx="62" ry="26" fill="none" stroke="'+sg(205)+'" stroke-width="1.6"/>',
    l:sT(6,40,'Dış oblik')+sT(6,64,'İç oblik')+sT(6,90,'Transversus abd.')+sT(312,38,'Latissimus dorsi','end')+sT(240,106,'QL','middle')+sT(236,172,'Psoas','middle')+sT(312,100,'ESK','end')+sT(296,160,'TP','middle')+sT(86,168,'Böbrek','middle')+sT(100,116,'Transversalis fasya','middle')};
  Object.assign(USGS,{
    isb:{t:'İnterskalen blok, C5–C6 transvers',c:'Lineer prob, transvers boyun; medial solda. Kökler anterior ve orta skalen kas arasında hipoekoik "trafik ışığı" dizisi; iğne in-plane lateralden orta skalenden geçer, LA kökler çevresinde yayılır.',
      a:sB(6,24,46)+sB(24,220,58)+sP('M0 24L170 24Q140 52 0 62Z',84)+sP('M72 72Q110 62 138 76L134 186Q98 194 72 180Z',80)+sP('M196 70Q252 60 320 80L320 200Q244 202 200 186Z',86)+sStr(70,190,74)+sBone('M88 204Q160 188 236 204','M88 204Q160 188 236 204L236 220L88 220Z'),
      b:sSk()+sL('M0 62Q140 52 170 24',1.4,170)+sLA('M146 86Q198 78 202 120Q194 162 150 154Q140 120 146 86Z')+sR(166,100,8)+sR(170,124,9)+sR(172,148,9)+sVes(34,112,15,14,1)+sVn(64,82,16,9)+sN(316,40,198,118),
      l:sT(20,42,'SKM')+sT(104,130,'ASK','middle')+sT(262,140,'OSK','middle')+sT(160,103,'C5','end')+sT(162,127,'C6','end')+sT(164,151,'C7','end')+sT(34,138,'KA','middle')+sT(64,70,'İJV','middle')+sT(190,170,'LA','middle')},
    scb:{t:'Supraklaviküler blok',c:'Lineer prob, supraklaviküler fossada koronal oblik; lateral solda. Pleksus subklavyen arterin lateralinde "üzüm salkımı"; birinci kaburga ve plevra derinde. İğne in-plane lateralden, ucu pleksus ile kaburga köşesine.',
      a:sB(6,24,46)+sB(24,220,60)+sP('M0 24L90 24Q70 80 0 110Z',82)+sP('M210 172L320 178L320 220L210 220Z',30)+sBone('M60 172Q140 150 212 170','M60 172Q140 150 212 170L212 220L60 220Z')+sL('M222 196H320',1,90),
      b:sSk()+sL('M0 24H320',1.3,160)+sL('M214 170Q268 182 320 178',3,220)+sLA('M110 104Q150 86 200 112Q196 150 140 152Q108 140 110 104Z')+[[134,112],[150,108],[164,118],[142,126],[158,132],[172,136],[130,138]].map(function(p){return sR(p[0],p[1],6)}).join('')+sVes(236,128,18,16,1)+sN(6,40,142,148),
      l:sT(18,60,'Orta skalen')+sT(150,96,'Pleksus','middle')+sT(236,104,'SA','middle')+sT(136,182,'1. kaburga','middle')+sT(272,172,'Plevra','middle')+sT(108,150,'LA','end')},
    icb:{t:'İnfraklaviküler blok, parasagital',c:'Lineer prob, korakoid medialinde parasagital; kranial solda. Kordlar aksiller arter çevresinde (lateral, posterior, medial); iğne in-plane kranialden arterin arkasına (saat 6) ilerler, LA arteri U biçiminde sarar.',
      a:sB(6,24,46)+sB(24,70,82)+sStr(24,70,104)+sB(70,106,72)+sStr(70,106,94)+sB(106,220,56)+sRibs([268],196,40),
      b:sSk()+sL('M0 24H320',1.3,165)+sL('M0 70H320',1.6,180)+sL('M0 106H320',1.6,180)+sLA('M132 140Q132 184 164 186Q196 184 196 150Q186 172 164 172Q144 170 140 140Z')+sVes(162,140,16,15,1)+sVn(210,150,14,11)+sNerve(138,122,8,6)+sNerve(166,170,8,6)+sNerve(186,156,7,5)+sN(8,30,154,168),
      l:sT(6,48,'Pektoralis majör')+sT(6,92,'Pektoralis minör')+sT(162,143,'AA','middle')+sT(210,153,'AV','middle')+sT(132,112,'LK','end')+sT(178,204,'PK','middle')+sT(196,172,'MK','start')+sT(120,190,'LA','end')},
    axb:{t:'Aksiller blok, transvers',c:'Lineer prob, aksillada transvers; lateral solda. Aksiller arter çevresinde median, ulnar ve radiyal sinir; muskulokutan sinir korakobrakiyal kas içinde. İğne in-plane lateralden, LA her sinirin çevresine ayrı ayrı verilir.',
      a:sB(6,22,46)+sB(22,220,62)+sP('M0 22L120 22Q110 70 60 90L0 92Z',84)+sP('M0 92L60 90Q100 110 110 150L0 160Z',78)+sP('M0 160L110 150Q200 160 320 150L320 220L0 220Z',74)+sL('M100 158Q200 166 320 156',2.4,215),
      b:sSk()+sLA('M118 96Q160 70 204 96Q206 134 162 140Q118 134 118 96Z')+sVes(162,104,13,12,1)+sVn(196,90,10,7)+sVn(198,122,9,6)+sNerve(138,88,8,6)+sNerve(204,66,7,5)+sNerve(166,132,7,5)+sNerve(70,110,7,5)+sN(6,30,140,112),
      l:sT(6,44,'Biseps')+sT(6,124,'Korakobrakiyal')+sT(6,186,'Triseps / konjoint tendon')+sT(162,107,'AA','middle')+sT(130,80,'M','end')+sT(212,62,'U','start')+sT(166,152,'R','middle')+sT(70,98,'MK','middle')+sT(218,124,'AV','start')},
    ssn:{t:'Suprascapular sinir bloğu, posterior fossa',c:'Lineer prob, spina skapula üzerinde koronal; medial solda. Sinir ve suprascapular arter fossa tabanında, supraspinatus altında; iğne in-plane lateralden fossa tabanına, LA kas ile kemik arasına verilir.',
      a:sB(6,24,46)+sB(24,62,80)+sStr(24,62,100)+sB(62,220,74)+sStr(62,150,96)+sBone('M0 140Q160 210 320 134','M0 140Q160 210 320 134L320 220L0 220Z'),
      b:sSk()+sL('M0 62H320',1.6,180)+sLen(110,220,174,22)+sVes(176,168,6,5)+'<circle cx="160" cy="168" r="4" fill="'+sg(215)+'"/>'+sN(312,26,166,164),
      l:sT(6,44,'Trapez')+sT(6,110,'Supraspinatus')+sT(160,206,'Supraskapular fossa','middle')+sT(186,160,'SSA','start')+sT(150,160,'SSS','end')+sT(126,182,'LA','end')},
    pecs:{t:'PECS (interpektoral + pektoserratus)',c:'Lineer prob, 3–4. kaburga düzeyinde ön aksiller hatta oblik; medial solda. PECS I: LA pektoralis majör ile minör arasına (torakoakromiyal arterin pektoral dalı yanında). PECS II: pektoralis minör ile serratus anterior arasına.',
      a:sB(6,22,46)+sB(22,62,82)+sStr(22,62,104)+sB(62,100,72)+sStr(62,100,94)+sB(100,128,78)+sB(128,220,52)+sP('M0 152L320 152L320 220L0 220Z',28)+sRibs([70,230],132,40),
      b:sSk()+sL('M0 62H320',1.6,182)+sL('M0 100H320',1.6,182)+sL('M110 150H190',2.8,220)+sLen(100,200,62,12)+sLen(150,260,100,12)+sVes(154,58,5,4)+sN(6,10,212,98),
      l:sT(312,44,'Pektoralis majör','end')+sT(312,84,'Pektoralis minör','end')+sT(312,118,'Serratus anterior','end')+sT(150,44,'PECS I','middle')+sT(205,90,'PECS II','middle')+sT(70,168,'Kaburga','middle')+sT(150,166,'Plevra','middle')},
    sap:{t:'Serratus anterior plan bloğu',c:'Lineer prob, orta aksiller hatta 4–5. kaburga üzerinde; kranial solda. Yüzeyel: LA latissimus dorsi ile serratus anterior arasına (torakodorsal arter yanında). Derin: serratus ile kaburga arasına.',
      a:sB(6,22,46)+sB(22,58,82)+sStr(22,58,104)+sB(58,100,74)+sStr(58,100,96)+sB(100,220,54)+sP('M0 132L320 132L320 220L0 220Z',28)+sRibs([80,240],112,42),
      b:sSk()+sL('M0 58H320',1.6,182)+sL('M122 130H198',2.8,220)+sLen(100,210,58,12)+sLen(200,290,100,10)+sVes(150,56,5,4)+sN(310,10,252,98),
      l:sT(6,42,'Latissimus dorsi')+sT(6,84,'Serratus anterior')+sT(150,44,'Yüzeyel','middle')+sT(250,88,'Derin','middle')+sT(80,140,'Kaburga','middle')+sT(160,146,'Plevra','middle')},
    spsip:{t:'SPSIP bloğu',c:'Lineer prob, skapula medial kenarında 2–3. kaburga üzerinde oblik; kranial solda. İğne in-plane kaudalden kraniyale ilerleyip kaburgaya temas eder; LA serratus posterior superior kası ile interkostal kaslar arasındaki fasyal plana verilir ve kaburgalar boyunca yayılır. Trapez ve romboid yüzeyeldedir.',
      a:sB(6,22,46)+sB(22,52,78)+sStr(22,52,100)+sB(52,80,70)+sStr(52,80,92)+sB(80,96,84)+sB(96,220,54)+sP('M0 140L320 140L320 220L0 220Z',28)+sRibs([80,236],114,44),
      b:sSk()+sL('M0 52H320',1.5,178)+sL('M0 80H320',1.5,178)+sL('M0 96H320',1.5,178)+sL('M124 138H192',2.8,220)+sLen(170,290,100,10)+sN(312,12,236,98),
      l:sT(6,40,'Trapez')+sT(6,68,'Romboid')+sT(6,92,'SPS kası')+sT(236,88,'LA','middle')+sT(80,142,'2. kaburga','middle')+sT(158,152,'Plevra','middle')},
    rib:{t:'Romboid interkostal blok (RIB)',c:'Lineer prob, skapula medial kenarı ile omurga arasında oblik; skapula solda. LA romboid majör ile interkostal kaslar arasındaki plana verilir.',
      a:sB(6,22,46)+sB(22,50,76)+sStr(22,50,98)+sB(50,92,82)+sStr(50,92,104)+sB(92,220,56)+sP('M0 146L320 146L320 220L0 220Z',28)+sBone('M0 74Q24 70 46 80','M0 74Q24 70 46 80L46 220L0 220Z')+sRibs([130,268],118,40),
      b:sSk()+sL('M46 50H320',1.5,176)+sL('M46 92H320',1.7,184)+sL('M170 144H228',2.8,220)+sLen(150,280,92,12)+sN(312,14,210,92),
      l:sT(312,38,'Trapez','end')+sT(312,74,'Romboid majör','end')+sT(24,96,'Skapula','middle')+sT(210,80,'LA','middle')+sT(130,146,'Kaburga','middle')+sT(200,158,'Plevra','middle')},
    mtapa:{t:'M-TAPA (perikondriyal)',c:'Lineer prob, kostal kenar üzerinde sagital oblik; kranial solda. Kostokondral kıkırdak hipoekoik oval; iğne in-plane kıkırdağın alt yüzüne, LA kıkırdak ile transversus abdominis arasına verilir.',
      a:sB(6,26,44)+sB(26,64,82)+sStr(26,64,104)+sB(64,220,64)+sP('M0 104Q160 98 320 106L320 124Q160 116 0 122Z',74)+sB(126,220,60)+sStr(130,214,74),
      b:sSk()+sL('M0 26H320',1.3,165)+sCart(206,82,60,18)+sL('M0 124Q160 116 320 126',2.2,205)+sLen(124,262,102,9)+sN(8,40,150,102),
      l:sT(6,46,'Dış oblik / rektus')+sT(206,85,'Kostal kıkırdak','middle')+sT(196,116,'LA','middle')+sT(312,116,'Transversus abd.','end')+sT(160,170,'Karaciğer','middle')},
    rsb:{t:'Rektus kılıf bloğu',c:'Lineer prob, göbek düzeyinde transvers; linea alba solda. LA rektus abdominis ile posterior rektus kılıfı arasına verilir; inferior epigastrik arter yakınlığına dikkat.',
      a:sB(6,40,42)+sL('M0 22Q120 26 320 20',.8,110)+sB(40,110,84)+sStr(40,110,106)+sP('M0 40L26 40L22 110L0 110Z',52)+sB(110,220,30)+sL('M0 176Q40 166 80 176T160 176T240 176T320 176',3,170),
      b:sSk()+sL('M0 40H320',1.6,185)+sL('M0 110H320',2,198)+sL('M0 118H320',1.8,185)+sL('M24 40L22 112',2.2,200)+sLen(110,260,110,12)+sVes(210,98,5,4)+sN(312,12,172,106),
      l:sT(12,30,'Linea alba')+sT(312,62,'Rektus abdominis','end')+sT(172,128,'Posterior kılıf / periton','middle')+sT(150,98,'LA','middle')+sT(214,90,'İEA','start')+sT(312,170,'Barsak','end')},
    eoi:{t:'External oblique intercostal (EOI) bloğu',c:'Lineer prob, ön aksiller hatta 6. kaburga üzerinde parasagital; kranial solda. LA dış oblik kas ile kaburga/interkostal kaslar arasındaki plana verilir.',
      a:sB(6,30,44)+sB(30,64,82)+sStr(30,64,104)+sB(64,220,58)+sP('M0 122L320 122L320 220L0 220Z',28)+sRibs([70,230],88,40),
      b:sSk()+sL('M0 30H320',1.3,165)+sL('M0 64H320',1.7,184)+sL('M112 118H188',2.8,220)+sLen(96,250,66,12)+sN(8,12,150,64),
      l:sT(312,50,'Dış oblik','end')+sT(150,56,'LA','middle')+sT(70,116,'6. kaburga','middle')+sT(150,110,'İnterkostal','middle')+sT(150,136,'Plevra','middle')},
    rifpb:{t:'Rektointerkostal fasiyal plan bloğu (RIFPB)',c:'Lineer prob, 6–7. kostal kıkırdaklar üzerinde parasagital, rektus lateral kenarına yakın; kranial solda. LA rektus abdominis ile 6.–7. kostal kıkırdaklar arasındaki plana verilir.',
      a:sB(6,26,44)+sB(26,72,84)+sStr(26,72,106)+sB(72,220,62)+sStr(76,126,80)+sB(128,220,56),
      b:sSk()+sL('M0 26H320',1.3,165)+sL('M0 72H320',1.7,186)+sCart(80,98,52,16)+sCart(242,98,52,16)+sL('M0 128H320',2,200)+sLen(110,240,72,12)+sN(8,14,160,72),
      l:sT(6,50,'Rektus abdominis')+sT(160,62,'LA','middle')+sT(80,101,'Kıkırdak','middle')+sT(242,101,'Kıkırdak','middle')+sT(160,104,'İnterkostal','middle')+sT(160,142,'Transversus torasis / periton','middle')},
    ql1:{t:'QL1 (lateral kuadratus lumborum)',c:'Konveks prob, iliak krista üzerinde flankta transvers; lateral solda, posterior sağda. İğne in-plane anterolateralden; LA QL kasının anterolateral kenarına, transversus abdominis aponerozu ile transversalis fasya arasına verilir.',
      a:QLB.a,b:QLB.b+sLA('M176 66Q198 58 208 78Q198 98 180 88Q172 76 176 66Z')+sN(8,30,192,76),l:QLB.l+sT(214,58,'LA','start')},
    ql2:{t:'QL2 (posterior kuadratus lumborum)',c:'Konveks prob, iliak krista üzerinde flankta transvers; lateral solda, posterior sağda. İğne in-plane anterolateralden; LA QL kasının posterior yüzeyine, QL ile latissimus dorsi/ESK arasındaki torakolomber fasya katmanına verilir.',
      a:QLB.a,b:QLB.b+sLen(198,292,72,12)+sN(8,22,244,67),l:QLB.l+sT(296,64,'LA','start')},
    ql3:{t:'QL3 (transmüsküler / anterior kuadratus lumborum, shamrock)',c:'Konveks prob, flank üzerinde transvers, L4 düzeyi; posterior solda. Transvers çıkıntı yonca sapı; QL lateralde, psoas anteriorda, ESK posteriorda. İğne QL kasını geçer; LA QL ile psoas arasına verilir.',
      a:sB(0,220,52)+sP('M0 20L320 20L320 60L0 70Z',70)+'<ellipse cx="264" cy="44" rx="44" ry="22" fill="'+sg(60)+'"/>'+'<ellipse cx="160" cy="104" rx="56" ry="30" fill="'+sg(84)+'"/>'+'<ellipse cx="244" cy="118" rx="42" ry="34" fill="'+sg(72)+'"/>'+'<ellipse cx="66" cy="136" rx="62" ry="34" fill="'+sg(80)+'"/>'+sBone('M128 162L212 152','M128 162L212 152L212 220L128 220Z')+sBone('M252 164Q290 146 320 152','M252 164Q290 146 320 152L320 220L252 220Z'),
      b:sL('M220 44A44 22 0 0 1 308 44',1.6,200)+sL('M246 44H284',2,190)+sLen(196,236,104,10)+sN(8,24,206,104),
      l:sT(160,96,'QL','middle')+sT(250,124,'Psoas','middle')+sT(66,140,'ESK','middle')+sT(170,178,'TP (L4)','middle')+sT(264,22,'Böbrek','middle')+sT(214,94,'LA','start')},
    tfpb:{t:'Transversalis fasya plan bloğu (TFPB)',c:'Lineer veya konveks prob, iliak krista üzerinde transvers, orta-arka aksiller hat; QL sağda. LA transversus abdominis ile transversalis fasya arasına, kasın aponeroza dönüştüğü yerin yakınına verilir.',
      a:sB(6,28,44)+sB(28,52,80)+sB(52,78,88)+sB(78,100,68)+sStr(28,100,100)+sB(100,220,40)+sP('M246 40L320 30L320 150L240 140Q250 90 246 40Z',80),
      b:sSk()+sL('M0 28H246',1.3,165)+sL('M0 52H246',1.5,180)+sL('M0 78H246',1.5,180)+sL('M0 102H248',2,205)+sL('M246 40Q252 90 240 140',1.6,190)+sLen(140,244,101,10)+sN(8,14,200,98),
      l:sT(6,44,'Dış oblik')+sT(6,70,'İç oblik')+sT(6,94,'Transversus abd.')+sT(286,96,'QL','middle')+sT(196,90,'LA','middle')+sT(120,120,'Transversalis fasya','middle')+sT(120,170,'Retroperitoneal yağ','middle')},
    peng:{t:'PENG bloğu',c:'Konveks prob, inguinal ligament altında pubik ramusa paralel transvers oblik; lateral solda. AİİS ile iliopubik eminens arasında psoas tendonu; LA tendon ile pubik ramus arasına, kemik üzerine verilir.',
      a:sB(6,26,44)+sB(26,220,62)+sP('M60 70Q160 60 240 76L240 146Q160 150 60 136Z',74)+sStr(70,140,94)+sBone('M0 150Q50 116 104 138Q170 168 236 150Q274 138 320 146','M0 150Q50 116 104 138Q170 168 236 150Q274 138 320 146L320 220L0 220Z'),
      b:sSk()+sL('M60 70Q160 60 240 76',1.5,180)+sLen(146,240,146,10)+'<ellipse cx="192" cy="132" rx="16" ry="6" fill="'+sg(210)+'"/>'+sVes(264,74,13,12,1)+sNerve(228,90,9,6)+sN(8,30,176,146),
      l:sT(52,120,'AİİS','middle')+sT(286,136,'İPE','middle')+sT(150,96,'İliopsoas','middle')+sT(192,122,'Psoas tendonu','middle')+sT(264,56,'FA','middle')+sT(228,106,'FS','middle')+sT(200,176,'LA','middle')}
  });
  var USGRX=[['mtapa',/M-TAPA/],['rifpb',/ektointerkostal|RIFPB/i],['rsb',/ektus kılıf/i],['eoi',/\bEOI\b|xternal oblique intercostal/i],['spsip',/SPSIP/],['rib',/omboid interkostal|\(RIB\)/i],['pecs',/PECS|nterpektoral|pektoserratus|Torasik duvar/i],['sap',/erratus anterior/i],['ql1',/uadratus lumborum|\bQL\b/i],['ql2',/uadratus lumborum|\bQL\b/i],['ql3',/uadratus lumborum|\bQL\b/i],['tfpb',/ransversalis fasya|TFPB/i],['peng',/PENG/],['isb',/nterskalen/i],['scb',/upraklaviküler (brakiyal|blok)|interskalen, supraklaviküler/i],['icb',/nfraklavik/i],['axb',/ksiller brakiyal|infraklaviküler, aksiller/i],['ssn',/uprascapular/i],['esp',/\bESP\b(?! ile)|rector spinae/i],['tap',/\bTAP\b/],['pvb',/aravertebral(?! blokla)/i],['fib',/fas(i)?ya iliaka/i],['acb',/d+uktör kanal/i],['pop',/opliteal (siyatik|\+ safen)/i],['saphen',/afen (sinir|blok)|[±+] safen/i],['ipack',/IPACK/i],['ii',/lioinguinal|liohipogastrik/i],['sgb',/tellat/i],['shp',/hipogastrik pleksus/i]];
  Object.assign(USGS,{
    ccb:{t:'Kostoklaviküler blok',c:'Lineer prob, klavikulanın hemen altında ona paralel, hafif sefalad eğik; lateral solda. Üç kord subklavius ile serratus anterior arasında, aksiller arterin lateralinde küme halinde; iğne in-plane lateralden kümenin ortasına, LA üç kordu birlikte sarar.',
      a:sB(6,24,46)+sB(24,220,56)+sB(24,64,82)+sStr(24,64,104)+'<ellipse cx="232" cy="74" rx="72" ry="11" fill="'+sg(78)+'"/>'+sB(140,164,76)+sStr(140,164,96)+sB(170,220,30),
      b:sSk()+sL('M0 64H320',1.6,180)+sL('M0 168Q160 162 320 166',3,225)+sLA('M134 96Q160 80 182 98Q182 124 158 126Q134 120 134 96Z')+sNerve(150,98,7,5)+sNerve(166,92,7,5)+sNerve(166,112,7,5)+sVes(202,100,12,11,1)+sVn(252,104,15,9)+sN(6,40,154,100),
      l:sT(6,44,'Pektoralis majör')+sT(250,62,'Subklavius','middle')+sT(140,90,'LK','end')+sT(178,86,'PK')+sT(152,128,'MK','end')+sT(202,124,'AA','middle')+sT(252,124,'AV','middle')+sT(6,152,'Serratus anterior')+sT(312,182,'Plevra','end')},
    cpb:{t:'Klavipektoral fasyal plan bloğu',c:'Lineer prob, klavikulanın kısa ekseninde (kırığın medial ve lateralinde); kaudal solda. Klavikula parlak kavisli kemik çizgisi ve altında akustik gölge; iğne in-plane kaudalden kemiğe değene dek, LA fasya ile periost arasında kemiğin üst yüzeyine yayılır.',
      a:sB(6,24,46)+sB(24,220,50)+sB(24,46,84)+sStr(24,46,104)+'<ellipse cx="62" cy="120" rx="66" ry="34" fill="'+sg(80)+'"/>'+'<ellipse cx="272" cy="118" rx="56" ry="30" fill="'+sg(74)+'"/>'+sBone('M110 112Q160 82 210 112','M110 112Q160 82 210 112L210 220L110 220Z'),
      b:sSk()+sL('M104 104Q160 70 216 104',1.3,170)+sLA('M110 106Q160 74 210 106Q160 86 110 106Z')+sN(6,40,128,98),
      l:sT(6,38,'Platisma')+sT(62,124,'Pektoralis majör','middle')+sT(272,122,'Deltoid / trapez','middle')+sT(160,150,'Klavikula','middle')+sT(160,72,'Klavipektoral fasya','middle')+sT(108,96,'LA','end')},
    ftb:{t:'Femoral üçgen bloğu',c:'Lineer prob, uyluğun anteromedialinde enine; lateral solda. Sartoriusun medial kenarı adduktor longusun medial kenarıyla kesişmeden hemen proksimalde; safen sinir ve vastus medialis siniri femoral arterin lateralinde, sartorius altında. İğne in-plane lateralden, LA arterin lateraline.',
      a:sB(6,28,46)+sB(28,220,54)+'<ellipse cx="168" cy="54" rx="80" ry="22" fill="'+sg(86)+'"/>'+'<ellipse cx="62" cy="122" rx="68" ry="44" fill="'+sg(78)+'"/>'+'<ellipse cx="272" cy="124" rx="50" ry="44" fill="'+sg(82)+'"/>'+sStr(36,70,100)+sBone('M14 178Q80 166 146 178','M14 178Q80 166 146 178L146 220L14 220Z'),
      b:sSk()+sLA('M128 92Q152 82 164 94Q158 106 136 104Q126 100 128 92Z')+sNerve(132,96,5,4)+sNerve(150,92,5,4)+sVes(170,100,10,9,1)+sVn(190,116,12,8)+sN(6,36,144,92),
      l:sT(168,48,'Sartorius','middle')+sT(62,124,'Vastus medialis','middle')+sT(272,126,'Adduktor longus','middle')+sT(80,198,'Femur','middle')+sT(146,84,'SS','end')+sT(130,114,'VMS','end')+sT(182,94,'FA')+sT(204,122,'FV')},
    gnb:{t:'Genikülar sinir bloğu, superomedial',c:'Lineer prob, dizin medialinde koronal; proksimal solda. Femur metafiz-diyafiz bileşkesinde kemik kortikal çizgisi; superomedial genikülar arter kemiğe komşu (Doppler). İğne kemik temasına kadar; LA vastus medialis ile kemik arasında yayılır.',
      a:sB(6,28,46)+sB(28,220,52)+sB(28,76,84)+sStr(28,76,104)+sBone('M0 120Q120 116 190 104Q250 92 320 90','M0 120Q120 116 190 104Q250 92 320 90L320 220L0 220Z'),
      b:sSk()+sL('M0 76H320',1.4,170)+sLA('M110 110Q150 98 184 104Q150 114 110 110Z')+sVes(154,106,4,3,1)+sN(30,30,140,104),
      l:sT(6,58,'Vastus medialis')+sT(140,100,'SMGA','end')+sT(60,150,'Femur metafizi','middle')+sT(250,128,'Medial epikondil','middle')+sT(186,96,'LA','start')},
    fnb:{t:'Femoral sinir bloğu, inguinal kıvrım',c:'Lineer prob, inguinal kıvrımda enine; lateral solda. Femoral sinir fasya iliakanın altında, iliopsoasın üzerinde, femoral arterin lateralinde üçgen hiperekoik yapı. İğne in-plane lateralden fasya iliakayı geçer; LA siniri fasya altında sarar.',
      a:sB(6,24,46)+sB(24,220,50)+'<ellipse cx="80" cy="128" rx="82" ry="40" fill="'+sg(82)+'"/>'+'<ellipse cx="270" cy="146" rx="50" ry="26" fill="'+sg(78)+'"/>'+sBone('M20 182Q90 166 170 182','M20 182Q90 166 170 182L170 220L20 220Z'),
      b:sSk()+sL('M0 38H320',1.2,160)+sL('M6 84Q90 82 180 84',1.6,190)+sLA('M126 88Q148 80 170 88Q150 98 126 88Z')+'<path d="M132 88L148 82L164 90Z" fill="'+sg(190)+'"/>'+sVes(196,74,11,10,1)+sVn(230,80,14,9)+sN(6,46,130,88),
      l:sT(80,132,'İliopsoas','middle')+sT(270,150,'Pektineus','middle')+sT(96,204,'Femur başı','middle')+sT(40,34,'Fasya lata','middle')+sT(40,80,'Fasya iliaka','middle')+sT(148,104,'FS','middle')+sT(196,62,'FA','middle')+sT(234,66,'FV','middle')},
    ankle:{t:'Ayak bileği bloğu, tibial sinir',c:'Lineer prob, medial malleol ile Aşil arasında enine; anterior solda. Tibial sinir fleksör retinakulumun derininde, posterior tibial arter ve venlerin posteriorunda bal peteği görünümlü. İğne in-plane posteriordan (veya out-of-plane), LA siniri sarar; prob basıncı en az tutulur.',
      a:sB(6,20,46)+sB(20,220,52)+sBone('M0 70Q40 60 70 90','M0 70Q40 60 70 90L70 220L0 220Z')+'<ellipse cx="202" cy="126" rx="56" ry="24" fill="'+sg(78)+'"/>'+'<ellipse cx="290" cy="80" rx="30" ry="14" fill="'+sg(120)+'"/>',
      b:sSk()+sL('M56 44Q180 40 300 46',1.4,175)+'<ellipse cx="88" cy="70" rx="10" ry="8" fill="'+sg(150)+'"/>'+'<ellipse cx="114" cy="68" rx="8" ry="7" fill="'+sg(150)+'"/>'+sLA('M162 72Q182 58 204 72Q196 88 178 88Q160 84 162 72Z')+sVes(156,68,6,6)+sVn(144,72,4,3)+sVn(170,72,4,3)+sNerve(184,76,9,7)+sN(314,30,196,74),
      l:sT(30,118,'Malleol','middle')+sT(88,92,'TP','middle')+sT(116,92,'FDL','middle')+sT(152,58,'PTA','middle')+sT(196,94,'TS','middle')+sT(202,130,'FHL','middle')+sT(290,104,'Aşil','middle')+sT(250,38,'Retinakulum','middle')},
    tlip:{t:'TLIP bloğu, L3 transvers',c:'Lineer veya konveks prob, L3 düzeyinde orta hattın 2–3 cm lateralinde enine; medial solda. Medialden laterale multifidus, longissimus ve iliokostalis; aralarında hiperekoik fasya çizgileri. İğne in-plane lateralden; klasikte LA multifidus ile longissimus arasını ayırır, modifiyede longissimus ile iliokostalis arasına verilir.',
      a:sB(6,20,46)+sB(20,220,50)+'<ellipse cx="66" cy="98" rx="46" ry="46" fill="'+sg(80)+'"/>'+'<ellipse cx="162" cy="94" rx="50" ry="44" fill="'+sg(86)+'"/>'+'<ellipse cx="262" cy="88" rx="54" ry="38" fill="'+sg(80)+'"/>'+sBone('M0 40L18 40L18 160L0 160','M0 40L18 40L18 220L0 220Z')+sBone('M18 160Q120 154 200 146Q260 140 320 146','M18 160Q120 154 200 146Q260 140 320 146L320 220L18 220Z'),
      b:sSk()+sL('M0 32H320',1.6,185)+sL('M112 52Q114 100 112 146',1.2,170)+sL('M212 52Q214 92 214 132',1.2,170)+sLA('M106 60Q120 98 106 140Q100 98 106 60Z')+sN(314,26,112,96),
      l:sT(12,190,'SP','middle')+sT(66,100,'Multifidus','middle')+sT(162,96,'Longissimus','middle')+sT(262,90,'İliokostalis','middle')+sT(160,28,'Torakolomber fasya','middle')+sT(160,180,'Lamina / TP','middle')+sT(100,150,'LA','end')}
  });
  USGRX.push(['ccb',/ostoklaviküler/i],['cpb',/lavipektoral/i],['ftb',/emoral üçgen/i],['gnb',/enikülar/i],['fnb',/emoral sinir bloğu|emoral \+ siyatik/i],['ankle',/^Ayak bileği bloğu/],['tlip',/TLIP/]);
  function usgKeys(n){return USGRX.filter(function(r){return r[1].test(n)}).map(function(r){return r[0]})}
  function usgRow(n,ph){var rk=Object.keys(USGMAP).filter(function(k){return USGMAP[k]===n});usgKeys(n).forEach(function(k){if(rk.indexOf(k)<0)rk.push(k)});return rk.length?'<div class="anim">'+rk.map(usgSim).join('')+'</div>':ph}
  Object.assign(USGS,{
    pop:{t:'Popliteal siyatik blok, bifurkasyon düzeyi',c:'Lineer prob, popliteal fossada transvers; lateral solda. Tibial ve ortak peroneal sinir ortak paranöral kılıf içinde; iğne in-plane lateralden, LA kılıf içinde iki siniri çevreler.',
      a:sB(6,30,46)+sB(30,220,56)+'<ellipse cx="70" cy="90" rx="82" ry="40" fill="'+sg(84)+'"/>'+'<ellipse cx="262" cy="92" rx="70" ry="42" fill="'+sg(80)+'"/>'+sStr(56,130,74)+sBone('M40 192Q160 178 280 194','M40 192Q160 178 280 194L280 220L40 220Z'),
      b:sSk()+sLA('M148 92Q188 60 232 84Q238 116 190 120Q150 116 148 92Z')+sNerve(176,92,10,8)+sNerve(208,88,12,9)+'<ellipse cx="200" cy="142" rx="12" ry="8" fill="#060606" stroke="'+sg(140)+'" stroke-width=".8"/>'+sVes(214,162,11,10,1)+sN(6,44,192,78),
      l:sT(10,72,'Biseps femoris')+sT(312,72,'Semimembranöz','end')+sT(176,76,'OPS','middle')+sT(208,72,'TS','middle')+sT(216,140,'PV','start')+sT(230,164,'PA','start')+sT(160,210,'Femur','middle')+sT(240,104,'LA','start')},
    ii:{t:'İlioinguinal / iliohipogastrik blok, SİAS medialinde',c:'Lineer prob, SİAS ile göbeği birleştiren çizgide oblik; lateral sağda (SİAS ve akustik gölgesi). Sinirler iç oblik ile transversus abdominis arasında; iğne in-plane medialden, LA bu planda sinirleri çevreler.',
      a:sB(6,40,42)+sB(40,66,80)+sStr(40,66,105)+sB(66,104,90)+sStr(66,104,112)+sB(104,124,66)+sStr(104,124,92)+sB(126,220,26)+sBone('M262 70Q290 52 320 50','M262 70Q290 52 320 50L320 220L262 220Z'),
      b:sSk()+sL('M0 40H262',1.6,185)+sL('M0 66H262',1.6,185)+sL('M0 104H262',1.8,190)+sL('M0 126H262',2.2,205)+sLA('M160 104Q200 92 240 104Q200 114 160 104Z')+sNerve(204,104,7,5)+sNerve(228,104,7,5)+sVes(248,110,4,3)+sN(8,8,176,100),
      l:sT(6,58,'Dış oblik')+sT(6,92,'İç oblik')+sT(6,118,'Transversus abd.')+sT(6,152,'Periton / barsak')+sT(292,42,'SİAS','middle')+sT(200,92,'İH','end')+sT(232,92,'İİ','start')+sT(216,124,'LA','middle')},
    sgb:{t:'Stellat ganglion bloğu, C6 transvers',c:'Lineer prob, C6 düzeyinde transvers; medial solda. Hedef longus colli önünde, prevertebral fasyanın altı; iğne in-plane lateralden, İJV ve karotisin arkasından geçer. Tiroid ve vertebral damarlar Doppler ile kontrol edilir.',
      a:sB(0,220,30)+sB(6,30,46)+'<ellipse cx="250" cy="44" rx="80" ry="15" fill="'+sg(88)+'"/>'+sStr(30,60,104)+'<ellipse cx="50" cy="84" rx="58" ry="32" fill="'+sg(112)+'"/>'+'<ellipse cx="150" cy="152" rx="52" ry="17" fill="'+sg(72)+'"/>'+sStr(136,168,96)+sBone('M90 180Q150 170 210 178Q236 160 262 170','M90 180Q150 170 210 178Q236 160 262 170L262 220L90 220Z'),
      b:sSk()+sL('M100 134Q150 128 214 136',1.4,190)+sLA('M118 134Q160 124 204 134Q160 142 118 134Z')+sNerve(146,130,5,4)+sVes(160,86,15,15,1)+sVn(206,80,20,11)+sN(312,60,198,132),
      l:sT(250,40,'SKM','middle')+sT(50,86,'Tiroid','middle')+sT(160,62,'KA','middle')+sT(210,62,'İJV','middle')+sT(150,164,'Longus colli','middle')+sT(176,150,'LA','middle')+sT(140,124,'SZ','end')+sT(150,206,'C6','middle')},
    saphen:{t:'Safen sinir bloğu, distal uyluk',c:'Lineer prob, distal uyluk medialinde transvers (aduktör kanal distali); lateral solda. Safen sinir sartorius altında, inen genikuler artere komşu; LA sartorius altında siniri çevreler.',
      a:sB(6,26,46)+sB(26,220,62)+'<ellipse cx="70" cy="130" rx="80" ry="50" fill="'+sg(80)+'"/>'+'<ellipse cx="280" cy="132" rx="62" ry="46" fill="'+sg(76)+'"/>'+'<ellipse cx="200" cy="58" rx="92" ry="28" fill="'+sg(88)+'"/>'+sStr(34,84,104)+sBone('M0 198Q60 178 140 194','M0 198Q60 178 140 194L140 220L0 220Z'),
      b:sSk()+sL('M108 58Q200 22 292 58Q260 86 200 88Q140 86 108 58',1.4,185)+sLen(170,244,92,10)+'<circle cx="204" cy="92" r="4" fill="'+sg(205)+'"/>'+sVes(226,96,5,4)+sN(8,30,198,90),
      l:sT(200,58,'Sartorius','middle')+sT(14,140,'Vastus medialis')+sT(300,140,'Grasilis','middle')+sT(196,84,'SS','end')+sT(236,92,'İGA','start')+sT(210,112,'LA','middle')+sT(60,210,'Femur','middle')},
    ipack:{t:'IPACK bloğu, femur kondilleri düzeyi',c:'Konveks veya lineer prob, diz arkasında transvers, kondiller düzeyi; medial solda. İğne in-plane medialden, popliteal arter ile femur arasına; LA diz kapsülünün arkasında yayılır.',
      a:sB(6,30,46)+sB(30,220,56)+'<ellipse cx="80" cy="86" rx="80" ry="36" fill="'+sg(80)+'"/>'+'<ellipse cx="256" cy="86" rx="70" ry="36" fill="'+sg(84)+'"/>'+sBone('M0 192Q70 148 150 172Q170 178 190 172Q260 148 320 190','M0 192Q70 148 150 172Q170 178 190 172Q260 148 320 190L320 220L0 220Z'),
      b:sSk()+sLen(120,230,170,9)+sVes(172,144,11,10,1)+'<ellipse cx="198" cy="134" rx="10" ry="7" fill="#060606" stroke="'+sg(140)+'" stroke-width=".8"/>'+sNerve(168,104,9,7)+sN(6,132,170,170),
      l:sT(80,90,'Semimembranöz','middle')+sT(256,90,'Biseps femoris','middle')+sT(172,148,'PA','middle')+sT(212,132,'PV','start')+sT(182,104,'TS','start')+sT(60,206,'Medial kondil','middle')+sT(270,206,'Lateral kondil','middle')+sT(176,188,'LA','middle')}
  });
  var USGKEY={};
  Object.keys(USGMAP).forEach(function(k){if(!USGKEY[USGMAP[k]])USGKEY[USGMAP[k]]=k});
  function CZDATA(){
    var LAT=['lateral','medial'],MED=['medial','lateral'],KR=['kranial','kaudal'];
    function fatTop(y){return ['band','f',8,y]}
    return {
    isb:{t:'İnterskalen blok',tu:'İnterskalen blok, C5–C7 transvers',o:MED,
      el:[fatTop(28),['path','m','M0 28L190 28Q170 62 0 76Z'],['ell','m2',128,140,40,58],['ell','m',318,138,92,62],['line','fs','M0 78Q160 66 200 34'],['bone','M90 204Q200 186 320 204',90,320],['ell','v',70,98,24,12],['ell','a',42,132,16,15],['ell','n',206,104,9,8],['ell','n',210,132,10,9],['ell','n',214,160,10,9]],
      la:'M184 90Q240 82 238 128Q242 178 192 178Q176 132 184 90Z',nd:[412,52,236,120],
      lb:[[40,46,'SKM'],[128,144,'ASK','middle'],[318,142,'OSK','middle'],[194,108,'C5','end'],[196,136,'C6','end'],[198,164,'C7','end'],[70,86,'İJV','middle'],[42,158,'KA','middle'],[250,190,'C7 TP','middle'],[244,92,'LA']],
      cap:'Boyun, krikoid kıkırdak düzeyinin altında enine kesit. Kökler (C5–C7) ön skalen (medialde) ile orta skalen (lateralde) arasında dizilir; karotis ve internal juguler ven medialde kalır. İğne lateralden orta skalenden geçer; enjektat kökler çevresinde, iki skalen arasında yayılır.',
      c:'Lineer prob, boyunda transvers; medial solda. Kökler ön ve orta skalen arasında hipoekoik "trafik ışığı" dizisi. İğne in-plane lateralden; LA kökleri çevreler.'},
    scb:{t:'Supraklaviküler blok',tu:'Supraklaviküler blok, koronal oblik',o:LAT,
      el:[fatTop(26),['path','m','M0 26L120 26Q100 84 0 112Z'],['bone','M110 188Q220 164 330 186',110,330],['line','pl','M0 200Q60 196 110 192'],['line','pl','M330 190Q380 196 420 200'],['ell','a',292,146,22,20],
        ['ell','n',168,120,8,7],['ell','n',186,112,8,7],['ell','n',202,124,8,7],['ell','n',176,138,8,7],['ell','n',196,142,8,7],['ell','n',214,148,8,7],['ell','n',158,140,7,6]],
      la:'M146 118Q190 96 232 128Q240 172 196 170Q150 162 146 118Z',nd:[8,40,214,166],
      lb:[[40,60,'Orta skalen','middle'],[186,100,'Pleksus','middle'],[292,120,'SA','middle'],[220,204,'1. kaburga','middle'],[400,182,'Plevra','end'],[142,158,'LA','end']],
      cap:'Supraklaviküler fossada koronal oblik kesit. Pleksus "üzüm salkımı" halinde subklavyen arterin lateralinde, birinci kaburganın üzerindedir; plevra kaburganın iki yanında derindedir. Enjektat pleksus ile kaburga arasındaki köşeden ("köşe cebi") başlayarak salkımı sarar.',
      c:'Lineer prob, supraklaviküler fossada koronal oblik; lateral solda. Pleksus subklavyen arterin lateralinde; birinci kaburga parlak çizgi ve akustik gölge, plevra kayan parlak çizgi. İğne in-plane lateralden köşe cebine.'},
    icb:{t:'İnfraklaviküler blok',tu:'İnfraklaviküler blok, parasagital',o:KR,
      el:[fatTop(28),['band','m',28,78],['band','m2',80,118],['band','m2',170,192],['line','pl','M0 198Q210 192 420 198'],['band','lu',199,220],['ell','a',212,140,16,15],['ell','v',272,152,14,11],['ell','n',190,120,8,6],['ell','n',214,170,8,6],['ell','n',238,156,7,5]],
      la:'M184 140Q186 188 214 190Q246 188 246 154Q234 176 214 176Q194 174 190 140Z',nd:[8,32,208,172],
      lb:[[8,54,'Pektoralis majör'],[8,100,'Pektoralis minör'],[212,144,'AA','middle'],[272,156,'AV','middle'],[180,114,'LK','end'],[214,188,'PK','middle'],[248,176,'MK'],[8,184,'Serratus anterior'],[300,212,'Plevra','middle']],
      cap:'Korakoidin medialinde parasagital kesit, kranial solda. Kordlar aksiller arter çevresindedir: lateral kord kraniyalde, posterior kord arterin arkasında, medial kord arter ile ven arasında. İğne arterin arkasına (saat 6) ilerler; enjektat arteri U biçiminde sarar.',
      c:'Lineer prob, korakoidin medialinde parasagital; kranial solda. İğne in-plane kranialden arterin arkasına; LA arteri U biçiminde sarar ve üç kordu kapsar.'},
    ccb:{t:'Kostoklaviküler blok',tu:'Kostoklaviküler blok',o:LAT,
      el:[fatTop(28),['band','m',28,80],['ell','m2',318,96,96,13],['band','m2',160,186],['line','pl','M0 188Q210 182 420 188'],['band','lu',189,220],['ell','a',268,130,15,14],['ell','v',334,134,20,12],['ell','n',196,128,9,7],['ell','n',214,119,9,7],['ell','n',216,139,9,7]],
      la:'M176 128Q200 102 236 122Q240 150 208 154Q178 150 176 128Z',nd:[8,50,198,128],
      lb:[[8,56,'Pektoralis majör'],[320,90,'Subklavius','middle'],[186,116,'LK','end'],[228,112,'PK'],[230,156,'MK'],[268,154,'AA','middle'],[334,154,'AV','middle'],[8,176,'Serratus anterior'],[300,208,'Plevra','middle']],
      cap:'İnfraklaviküler fossada klavikulaya paralel kesit. Lateral, posterior ve medial kordlar subklavius ile serratus anterior arasındaki kostoklaviküler aralıkta, aksiller arterin lateralinde küme halindedir. İğne lateralden kümenin ortasına; enjektat üç kordu birlikte sarar.',
      c:'Lineer prob, klavikulanın hemen altında ona paralel, hafif sefalad eğik; lateral solda. Kordlar aksiller arterin lateralinde küme halinde. İğne in-plane lateralden; LA kümenin ortasından yayılır.'},
    axb:{t:'Aksiller blok',tu:'Aksiller blok, transvers',o:LAT,
      el:[fatTop(24),['band','m',24,76],['ell','m2',70,128,74,32],['line','fs','M0 172Q210 180 420 168'],['band','m',176,220],['ell','a',212,122,14,13],['ell','v',262,104,11,8],['ell','v',264,144,10,7],['ell','n',182,106,9,7],['ell','n',262,84,8,6],['ell','n',214,154,8,6],['ell','n',78,128,8,6]],
      la:'M160 118Q208 80 260 114Q262 160 212 164Q160 158 160 118Z',nd:[8,40,188,118],
      lb:[[8,50,'Biseps'],[70,104,'Korakobrakiyal','middle'],[8,198,'Triseps / konjoint tendon'],[212,126,'AA','middle'],[172,100,'M','end'],[276,82,'U'],[214,174,'R','middle'],[78,148,'MK','middle'],[278,150,'AV']],
      cap:'Aksillada enine kesit. Median, ulnar ve radiyal sinir aksiller arter çevresinde; muskulokutan sinir korakobrakiyal kas içindedir. Konjoint tendon radiyal sinirin derininde parlak bir çizgi oluşturur. Enjektat her sinirin çevresine ayrı ayrı verilir.',
      c:'Lineer prob, aksillada transvers; lateral solda. İğne in-plane lateralden; LA arter çevresindeki sinirleri ve korakobrakiyal kastaki muskulokutan siniri ayrı ayrı sarar.'},
    ssn:{t:'Suprascapular sinir bloğu (posterior)',tu:'Suprascapular sinir bloğu, posterior fossa',o:MED,
      el:[fatTop(26),['band','m',26,62],['band','m2',62,160],['bone','M0 150Q210 224 420 140',0,420],['ell','a',224,180,7,6],['ell','n',206,182,5,4]],
      la:'M150 184Q214 152 290 178Q214 196 150 184Z',nd:[412,34,226,176],
      lb:[[8,46,'Trapez'],[8,110,'Supraspinatus'],[232,174,'SSA'],[198,176,'SSS','end'],[300,204,'Supraspinöz fossa','middle']],
      cap:'Spina skapulanın üzerinde koronal kesit. Suprascapular sinir ve arter fossa tabanında, supraspinatusun altında seyreder; enjektat kas ile kemik arasına verilir.',
      c:'Lineer prob, spina skapula üzerinde koronal; medial solda. İğne in-plane lateralden fossa tabanına; LA supraspinatus ile kemik arasında yayılır.'},
    cpb:{t:'Klavipektoral fasyal plan bloğu',tu:'Klavipektoral fasyal plan bloğu',o:['kaudal','kranial'],
      el:[fatTop(40),['band','m',40,62],['ell','m2',80,150,84,40],['ell','m',356,148,70,34],['rbone',210,132,58,40],['ell','m2',206,196,40,10],['line','fs','M140 116Q210 82 280 116']],
      la:'M146 114Q210 80 274 114Q210 98 146 114Z',nd:[8,52,176,104],
      lb:[[8,54,'Platisma'],[80,154,'Pektoralis majör','middle'],[356,152,'Deltoid / trapez','middle'],[210,150,'Klavikula','middle'],[206,214,'Subklavius','middle'],[300,98,'Klavipektoral fasya'],[150,104,'LA','end']],
      cap:'Klavikulanın kısa ekseninde kesit; kırık hattının medial ve lateralinde ayrı ayrı yapılır. Klavipektoral fasya klavikulanın üst yüzeyini sarar; iğne kemiğe değene dek ilerler, enjektat fasya ile periost arasında yayılır. Deri için ayrıca supraklaviküler sinir bloğu gerekebilir.',
      c:'Lineer prob, klavikulanın kısa ekseninde; kaudal solda. Klavikula parlak kavisli çizgi ve akustik gölge. İğne in-plane kaudalden kemiğe; LA fasya ile periost arasında kemiğin üst yüzeyine yayılır.'},
    pecs:{t:'PECS bloğu (interpektoral + pektoserratus)',tu:'PECS I ve II',o:MED,
      el:[fatTop(26),['band','m',26,70],['path','m2','M90 72L420 72L420 112L140 112Q100 100 90 72Z'],['band','m',118,150],['rbone',120,158,60,16],['rbone',330,156,60,16],['path','m2','M180 150L270 150L270 172L180 172Z'],['line','pl','M180 178Q225 174 270 176'],['ell','a',210,71,5,4]],
      la:'M150 71Q216 60 286 71Q216 82 150 71Z M220 115Q300 104 380 115Q300 126 220 115Z',nd:[8,32,336,114],
      lb:[[8,48,'Pektoralis majör'],[300,94,'Pektoralis minör','middle'],[8,136,'Serratus anterior'],[120,186,'3. kaburga','middle'],[330,184,'4. kaburga','middle'],[222,66,'TAA'],[390,124,'LA (PECS II)','end']],
      cap:'Ön aksiller hatta 3–4. kaburga düzeyinde oblik kesit. PECS I: enjektat pektoralis majör ile minör arasına, torakoakromiyal arterin pektoral dalı yanında. PECS II: ikinci enjeksiyon pektoralis minör ile serratus anterior arasına.',
      c:'Lineer prob, ön aksiller hatta oblik; medial solda. İğne in-plane medialden laterale; önce minör ile serratus arası (PECS II), çekilirken majör ile minör arası (PECS I).'},
    sap:{t:'Serratus anterior plan bloğu',tu:'Serratus anterior plan bloğu',o:KR,
      el:[fatTop(26),['band','m',26,70],['band','m2',70,104],['rbone',110,130,60,16],['rbone',310,128,60,16],['path','m','M170 122L250 122L250 146L170 146Z'],['line','pl','M170 152Q210 148 250 150'],['ell','a',212,70,5,4]],
      la:'M100 70Q212 56 330 70Q212 84 100 70Z',nd:[8,34,268,70],
      lb:[[8,48,'Latissimus dorsi'],[8,90,'Serratus anterior'],[110,160,'Kaburga','middle'],[310,158,'Kaburga','middle'],[224,66,'TDA'],[210,170,'Plevra','middle']],
      cap:'Orta aksiller hatta 4–5. kaburga üzerinde kesit, kranial solda. Yüzeyel yaklaşımda enjektat latissimus dorsi ile serratus anterior arasına (torakodorsal arter yanında), derin yaklaşımda serratus ile kaburga arasına verilir.',
      c:'Lineer prob, orta aksiller hatta; kranial solda. İğne in-plane; LA latissimus ile serratus arasında (yüzeyel) mercek biçiminde yayılır.'},
    esp:{t:'Erector spinae plan bloğu',tu:'ESP bloğu, parasagital',o:KR,
      el:[fatTop(26),['band','m',26,52],['band','m2',52,76],['band','m',76,128],['bone','M40 132L130 132L130 140',40,130],['bone','M170 132L260 132L260 140',170,260],['bone','M300 132L390 132L390 140',300,390]],
      la:'M40 130Q215 112 390 130Q215 142 40 130Z',nd:[8,30,196,130],
      lb:[[8,44,'Trapez'],[8,68,'Romboid majör'],[8,104,'Erector spinae'],[85,160,'TP','middle'],[215,160,'TP','middle'],[345,160,'TP','middle'],[300,124,'LA']],
      cap:'Orta hattın yaklaşık 3 cm lateralinde parasagital kesit, kranial solda. T5 üzerinde trapez, romboid ve erector spinae üç katman görülür. İğne kranialden transvers çıkıntıya değer; enjektat kas ile çıkıntılar arasında kraniokaudal yayılır.',
      c:'Lineer prob, parasagital; kranial solda. Transvers çıkıntılar kare parlak kenar ve gölge. İğne in-plane kranialden kaudale, ucu çıkıntıya; LA kasın altında çıkıntılar boyunca yayılır.'},
    pvb:{t:'Torasik paravertebral blok',tu:'Torasik paravertebral blok, transvers',o:MED,
      el:[fatTop(26),['band','m',26,92],['bone','M0 110L120 110Q140 112 150 120',0,150],['line','fs','M150 118Q260 132 420 128'],['line','pl','M150 176Q280 160 420 150']],
      la:'M152 124Q200 128 230 140Q200 166 154 172Z',nd:[412,40,170,138],
      lb:[[8,62,'Erector spinae'],[60,160,'TP','middle'],[330,124,'İç interkostal membran','middle'],[330,170,'Plevra','middle'],[188,150,'PVA']],
      cap:'İnterkostal aralıkta enine kesit, medial solda. Paravertebral aralık transvers çıkıntının ucu, iç interkostal membran ve plevra arasındaki üçgendir. İğne lateralden membranı geçer; enjektat aralığı doldurup plevrayı aşağı iter.',
      c:'Lineer prob, transvers interkostal; medial solda. İğne in-plane lateralden; LA paravertebral aralıkta plevrayı aşağı iterken görülür.'},
    rib:{t:'Romboid interkostal blok',tu:'Romboid interkostal blok (RIB)',o:['medial (skapula)','lateral'],
      el:[fatTop(26),['band','m',26,52],['band','m2',52,86],['rbone',130,104,60,16],['rbone',320,104,60,16],['path','m','M190 96L260 96L260 126L190 126Z'],['line','pl','M190 132Q225 128 260 130']],
      la:'M100 88Q220 76 330 88Q220 100 100 88Z',nd:[412,30,232,88],
      lb:[[8,44,'Trapez'],[8,74,'Romboid majör'],[130,132,'Kaburga','middle'],[320,132,'Kaburga','middle'],[225,114,'İK','middle'],[225,150,'Plevra','middle']],
      cap:'Skapulanın medial kenarı ile omurga arasında oblik kesit. Enjektat romboid majör ile interkostal kaslar arasındaki planda yayılır.',
      c:'Lineer prob, skapula medial kenarı ile omurga arasında oblik. İğne in-plane; LA romboid ile interkostal kaslar arasında yayılır.'},
    spsip:{t:'SPSIP bloğu',tu:'SPSIP bloğu',o:KR,
      el:[fatTop(26),['band','m',26,50],['band','m2',50,76],['band','m',76,98],['rbone',160,118,60,16],['rbone',350,118,60,16],['path','m2','M220 110L290 110L290 140L220 140Z'],['line','pl','M220 146Q255 142 290 144']],
      la:'M120 104Q220 92 320 104Q220 114 120 104Z',nd:[412,40,250,104],
      lb:[[8,42,'Trapez'],[8,66,'Romboid'],[8,90,'Serratus posterior superior'],[160,146,'2. kaburga','middle'],[350,146,'3. kaburga','middle'],[255,164,'Plevra','middle']],
      cap:'Skapula medial kenarında 2.–3. kaburga düzeyinde kesit. İğne kaudalden kaburgaya temas eder; enjektat serratus posterior superior ile kaburga ve interkostal kaslar arasındaki planda yayılır.',
      c:'Lineer prob, skapula medial kenarında oblik; kranial solda. İğne in-plane kaudalden kraniyale, kaburgaya temas; LA fasyal planda yayılır.'},
    tap:{t:'TAP bloğu',tu:'TAP bloğu, orta aksiller hat',o:MED,
      el:[fatTop(34),['band','m',34,62],['band','m2',62,104],['band','m',104,124],['line','fs','M0 126H420'],['band','p',127,220]],
      la:'M140 104Q220 90 310 104Q220 116 140 104Z',nd:[8,40,196,102],
      lb:[[8,52,'Dış oblik'],[8,88,'İç oblik'],[8,118,'Transversus abd.'],[8,170,'Periton / barsak'],[300,98,'LA']],
      cap:'Orta aksiller hatta enine kesit. Enjektat iç oblik ile transversus abdominis arasındaki fasyal planda mercek biçiminde yayılır.',
      c:'Lineer prob, transvers; medial solda. İğne in-plane medialden; LA iç oblik ile transversus abdominis arasında mercek biçiminde yayılır.'},
    rsb:{t:'Rektus kılıf bloğu',tu:'Rektus kılıf bloğu, göbek düzeyi',o:['medial (linea alba)','lateral'],
      el:[fatTop(32),['line','fs','M0 34H420'],['path','m','M40 36L420 36L420 128L40 128Q20 82 40 36Z'],['line','fs','M30 130H420'],['band','f',131,146],['band','p',146,220],['ell','a',290,124,6,5]],
      la:'M150 129Q240 116 340 129Q240 140 150 129Z',nd:[412,40,262,126],
      lb:[[230,84,'Rektus abdominis','middle'],[14,84,'Linea alba','start'],[300,118,'İEA'],[8,180,'Periton / barsak'],[150,142,'Arka kılıf','end']],
      cap:'Göbek düzeyinde enine kesit, linea alba solda. Enjektat rektus kası ile arka rektus kılıfı arasına verilir; inferior epigastrik artere dikkat.',
      c:'Lineer prob, göbek düzeyinde transvers; linea alba solda. İğne in-plane; LA rektus ile arka kılıf arasında yayılır.'},
    mtapa:{t:'M-TAPA (perikondriyal)',tu:'M-TAPA',o:KR,
      el:[fatTop(30),['band','m',30,62],['ell','k',150,100,74,32],['band','m2',138,160],['band','p',160,220]],
      la:'M84 134Q160 120 240 134Q160 146 84 134Z',nd:[412,40,178,134],
      lb:[[8,48,'Rektus / dış oblik'],[150,104,'Kostal kıkırdak','middle'],[8,152,'Transversus abd.'],[260,130,'LA']],
      cap:'Kostal kenar üzerinde sagital oblik kesit. İğne kostokondral kıkırdağın alt yüzüne ilerler; enjektat kıkırdak ile transversus abdominis arasına verilir.',
      c:'Lineer prob, kostal kenar üzerinde sagital oblik; kranial solda. Kıkırdak hipoekoik oval. İğne in-plane kıkırdağın alt yüzüne; LA kıkırdak ile transversus arasında yayılır.'},
    eoi:{t:'External oblique intercostal (EOI) bloğu',tu:'EOI bloğu',o:KR,
      el:[fatTop(28),['band','m',28,72],['rbone',120,96,60,16],['rbone',320,96,60,16],['path','m2','M180 88L260 88L260 120L180 120Z'],['line','pl','M180 126Q220 122 260 124']],
      la:'M60 76Q215 64 390 76Q215 88 60 76Z',nd:[8,34,220,76],
      lb:[[8,52,'Dış oblik'],[120,124,'6. kaburga','middle'],[320,124,'7. kaburga','middle'],[220,108,'İK','middle'],[220,144,'Plevra','middle']],
      cap:'Ön aksiller hatta 6. kaburga üzerinde parasagital kesit. Enjektat dış oblik kas ile kaburga ve interkostal kaslar arasındaki planda yayılır.',
      c:'Lineer prob, parasagital; kranial solda. İğne in-plane; LA dış oblik ile kaburga arasında yayılır.'},
    rifpb:{t:'Rektointerkostal fasyal plan bloğu (RIFPB)',tu:'RIFPB',o:KR,
      el:[fatTop(30),['band','m',30,90],['ell','k',120,118,66,24],['ell','k',310,118,66,24],['band','m2',150,170],['band','p',170,220]],
      la:'M80 94Q215 82 360 94Q215 106 80 94Z',nd:[8,34,200,94],
      lb:[[8,60,'Rektus abdominis'],[120,122,'6. kıkırdak','middle'],[310,122,'7. kıkırdak','middle'],[8,162,'Transversus abd.']],
      cap:'6–7. kostal kıkırdaklar üzerinde parasagital kesit. Enjektat rektus abdominis ile 6.–7. kostal kıkırdaklar arasındaki planda yayılır.',
      c:'Lineer prob, kostal kıkırdaklar üzerinde parasagital; kranial solda. İğne in-plane; LA rektus ile kıkırdaklar arasında yayılır.'}
    };
  }
  function CZDATA2(){
    var LAT=['lateral','medial'],MED=['medial','lateral'],KR=['kranial','kaudal'];
    function fatTop(y){return ['band','f',8,y]}
    function QL(){return [fatTop(22),['path','m','M0 22L150 22Q190 34 210 56L0 48Z'],['path','m2','M0 48L210 56Q190 66 0 76Z'],['path','m','M0 76Q190 66 214 62Q190 84 0 100Z'],['path','m','M200 22L420 22L420 52Q320 46 210 40Z'],['ell','m2',300,104,74,32],['ell','m',294,170,64,30],['path','m','M370 54L420 54L420 140Q392 126 370 54Z'],['ell','p',100,166,80,30],['line','fs','M0 102Q190 86 226 98Q236 132 244 164'],['bone','M352 150L420 150',352,420]]}
    var QLL=[[8,40,'Dış oblik'],[8,64,'İç oblik'],[8,90,'Transversus abd.'],[412,40,'Latissimus dorsi','end'],[300,108,'QL','middle'],[294,174,'Psoas','middle'],[412,110,'ESK','end'],[386,168,'TP','middle'],[100,170,'Böbrek','middle']];
    return {
    ql1:{t:'QL1 (lateral kuadratus lumborum)',tu:'QL1',o:['lateral (anterior)','posterior'],el:QL(),la:'M206 92Q232 86 236 104Q224 116 208 108Z',nd:[8,30,214,98],lb:QLL,
      cap:'İliak krista üzerinde flankta enine kesit. Enjektat QL kasının anterolateral kenarına, transversus abdominis aponeurozu ile transversalis fasya arasına verilir.',
      c:'Konveks prob, iliak krista üzerinde transvers; lateral solda, posterior sağda. İğne in-plane anterolateralden; LA QL kasının anterolateral kenarında.'},
    ql2:{t:'QL2 (posterior kuadratus lumborum)',tu:'QL2',o:['lateral (anterior)','posterior'],el:QL(),la:'M248 72Q300 62 352 74Q300 84 248 72Z',nd:[8,26,262,72],lb:QLL,
      cap:'Flankta enine kesit. Enjektat QL kasının posterior yüzeyine, QL ile latissimus dorsi ve erector spinae arasındaki torakolomber fasya katmanına verilir.',
      c:'Konveks prob, flankta transvers; lateral solda. İğne in-plane anterolateralden; LA QL kasının posterior yüzeyinde yayılır.'},
    ql3:{t:'QL3 (transmüsküler kuadratus lumborum)',tu:'QL3',o:['lateral (anterior)','posterior'],el:QL(),la:'M248 138Q296 128 344 140Q296 150 248 138Z',nd:[412,60,296,138],lb:QLL,
      cap:'Flankta L4 düzeyinde enine kesit. İğne posteriordan QL kasını geçer; enjektat QL ile psoas arasına verilir.',
      c:'Konveks prob, flankta transvers, L4; posterior sağda. Transvers çıkıntı, QL, psoas ve ESK yonca biçimi. İğne in-plane posteriordan QL\'yi geçer; LA QL ile psoas arasında.'},
    tfpb:{t:'Transversalis fasya plan bloğu (TFPB)',tu:'TFPB',o:['lateral (anterior)','posterior'],el:QL(),la:'M150 98Q186 90 220 100Q186 110 150 98Z',nd:[8,40,176,100],lb:QLL,
      cap:'İliak krista üzerinde enine kesit. Enjektat transversus abdominis ile transversalis fasya arasına, kasın aponeuroza dönüştüğü yerin yakınına verilir.',
      c:'Lineer veya konveks prob, iliak krista üzerinde transvers; lateral solda. İğne in-plane; LA transversus abdominis ile transversalis fasya arasında.'},
    ii:{t:'İlioinguinal / iliohipogastrik blok',tu:'İlioinguinal / iliohipogastrik blok',o:['medial','lateral (SİAS)'],
      el:[fatTop(40),['band','m',40,66],['band','m2',66,104],['band','m',104,124],['line','fs','M0 126H340'],['band','p',127,220],['bone','M340 80Q380 58 420 56',340,420],['ell','a',316,110,4,3],['ell','n',262,104,7,5],['ell','n',292,104,7,5]],
      la:'M210 104Q262 90 318 104Q262 116 210 104Z',nd:[8,8,232,100],
      lb:[[8,58,'Dış oblik aponeurozu'],[8,90,'İç oblik'],[8,118,'Transversus abd.'],[8,170,'Periton / barsak'],[384,48,'SİAS','middle'],[262,94,'İH','end'],[296,94,'İİ']],
      cap:'SİAS\'in hemen medialinde, SİAS ile göbeği birleştiren çizgide enine kesit. İlioinguinal ve iliohipogastrik sinirler iç oblik ile transversus abdominis arasındaki planda seyreder.',
      c:'Lineer prob, SİAS medialinde oblik; SİAS sağda. İğne in-plane medialden; LA iç oblik ile transversus arasında sinirleri sarar.'},
    peng:{t:'PENG bloğu',tu:'PENG bloğu',o:LAT,
      el:[fatTop(30),['ell','m2',230,96,150,36],['ell','l',236,124,22,6],['bone','M0 150Q60 112 120 138Q220 172 320 132Q370 116 420 146',0,420],['ell','a',352,66,13,12],['ell','v',390,72,15,10],['ell','n',318,72,9,6]],
      la:'M170 150Q232 132 292 152Q232 164 170 150Z',nd:[8,30,232,148],
      lb:[[230,90,'İliopsoas','middle'],[262,126,'Psoas tendonu'],[60,170,'AİİS','middle'],[340,170,'İliopubik eminens','middle'],[352,50,'FA','middle'],[392,58,'FV','middle'],[310,64,'FS','end']],
      cap:'İnguinal ligamentin altında pubik ramusa paralel kesit. Psoas tendonu AİİS ile iliopubik eminens arasında, kemiğin üzerindedir. İğne lateralden kemiğe değer; enjektat tendon ile pubik ramus arasına verilir.',
      c:'Konveks prob, pubik ramusa paralel transvers oblik; lateral solda. İğne in-plane lateralden kemiğe; LA psoas tendonunu kemikten kaldırarak yayılır.'},
    fib:{t:'Fasya iliaka bloğu (infrainguinal)',tu:'Fasya iliaka bloğu, inguinal transvers',o:LAT,
      el:[fatTop(30),['line','fs','M0 40H420'],['ell','m',80,64,80,20],['line','fs','M0 90Q200 84 330 92'],['ell','m2',190,144,200,50],['ell','a',350,74,13,12],['ell','v',392,80,16,10],['ell','n',302,98,16,6]],
      la:'M60 92Q190 80 300 96Q190 106 60 92Z',nd:[8,40,180,92],
      lb:[[30,36,'Fasya lata'],[80,68,'Sartorius','middle'],[24,86,'Fasya iliaka'],[190,148,'İliak kas','middle'],[350,58,'FA','middle'],[392,64,'FV','middle'],[302,116,'FS','middle']],
      cap:'Kasıkta enine kesit. Enjektat fasya iliaka ile iliak kas arasında lateralden mediale, femoral sinire doğru yayılır. Suprainguinal yaklaşımda prob inguinal ligamentin üstünde sagitaldir.',
      c:'Lineer prob, kasıkta transvers; lateral solda. İğne in-plane lateralden fasya iliakayı geçer; LA fasya altında mediale yayılır.'},
    fnb:{t:'Femoral sinir bloğu',tu:'Femoral sinir bloğu, inguinal kıvrım',o:LAT,
      el:[fatTop(30),['line','fs','M0 46H420'],['ell','m2',120,142,110,44],['line','fs','M10 98Q140 94 250 98'],['ell','m',360,160,62,30],['rbone',130,196,90,22],['ell','a',268,90,14,13],['ell','v',312,96,18,12],['ell','n',200,108,18,7]],
      la:'M150 106Q200 96 246 108Q200 120 150 106Z',nd:[8,60,180,108],
      lb:[[40,42,'Fasya lata','middle'],[40,92,'Fasya iliaka','middle'],[110,146,'İliopsoas','middle'],[360,164,'Pektineus','middle'],[130,214,'Femur başı','middle'],[200,128,'FS','middle'],[268,72,'FA','middle'],[312,80,'FV','middle']],
      cap:'İnguinal kıvrımda enine kesit. Femoral sinir fasya iliakanın altında, iliopsoasın üzerinde ve femoral arterin lateralindedir; arter ve ven fasya iliakanın üstünde kalır. Enjektat fasya altında siniri sarar. Kuadriseps güçsüzlüğü yapar.',
      c:'Lineer prob, inguinal kıvrımda enine; lateral solda. İğne in-plane lateralden fasya iliakayı geçer; LA siniri fasya altında sarar.'},
    acb:{t:'Aduktör kanal bloğu',tu:'Aduktör kanal bloğu, orta uyluk',o:LAT,
      el:[fatTop(30),['ell','m',232,62,112,30],['ell','m2',80,142,92,56],['ell','m',362,148,70,58],['rbone',120,198,60,26],['ell','a',240,124,13,12],['ell','v',262,148,13,9],['ell','n',216,112,6,5]],
      la:'M198 108Q236 96 272 112Q262 136 222 136Q196 130 198 108Z',nd:[8,48,212,110],
      lb:[[232,58,'Sartorius','middle'],[80,146,'Vastus medialis','middle'],[362,152,'Adduktor longus / magnus','middle'],[120,214,'Femur','middle'],[206,106,'SS','end'],[256,120,'FA'],[278,152,'FV']],
      cap:'Uyluk ortasında enine kesit. Sartorius altındaki kanalda femoral arter, ven ve arterin lateralinde safen sinir bulunur. Enjektat sartorius altında arterin çevresinde yayılır.',
      c:'Lineer prob, uyluk ortasında transvers; lateral solda. İğne in-plane lateralden sartorius altına; LA arterin lateralinden kanal içinde yayılır.'},
    ftb:{t:'Femoral üçgen bloğu',tu:'Femoral üçgen bloğu',o:LAT,
      el:[fatTop(30),['ell','m',220,72,104,26],['ell','m2',82,144,86,50],['ell','m',354,144,64,50],['rbone',110,198,64,24],['ell','a',224,124,13,12],['ell','v',250,146,15,10],['ell','n',172,118,6,5],['ell','n',198,112,6,5]],
      la:'M162 114Q200 100 236 116Q228 132 196 132Q164 128 162 114Z',nd:[8,48,192,112],
      lb:[[220,76,'Sartorius','middle'],[82,148,'Vastus medialis','middle'],[354,148,'Adduktor longus','middle'],[110,214,'Femur','middle'],[198,104,'SS','end'],[164,134,'VMS','middle'],[240,122,'FA'],[268,150,'FV']],
      cap:'Femoral üçgenin apeksine yakın enine kesit: sartoriusun medial kenarı adduktor longusun medial kenarıyla kesişmeden hemen önce. Safen sinir ve vastus medialis siniri arterin lateralinde, sartorius altındadır. Büyük hacim femoral sinire yayılıp kuadriseps güçsüzlüğü yapabilir.',
      c:'Lineer prob, uyluğun anteromedialinde enine; lateral solda. İğne in-plane lateralden; LA arterin lateralinde sartorius altında yayılır.'},
    saphen:{t:'Safen sinir bloğu (distal uyluk)',tu:'Safen sinir bloğu, distal uyluk',o:LAT,
      el:[fatTop(32),['ell','m',220,74,100,28],['ell','m2',80,142,86,52],['ell','m',362,142,64,48],['rbone',110,200,62,24],['ell','a',236,108,5,4],['ell','n',214,104,6,5]],
      la:'M180 104Q216 92 254 106Q216 118 180 104Z',nd:[8,46,204,104],
      lb:[[220,70,'Sartorius','middle'],[80,146,'Vastus medialis','middle'],[362,146,'Grasilis','middle'],[110,216,'Femur','middle'],[202,100,'SS','end'],[246,114,'İGA']],
      cap:'Distal uyluk medialinde, aduktör kanalın distalinde enine kesit. Safen sinir sartorius altında, inen genikülar artere komşudur; enjektat sartorius altında siniri sarar.',
      c:'Lineer prob, distal uyluk medialinde transvers; lateral solda. İğne in-plane lateralden; LA sartorius altında siniri sarar.'},
    pop:{t:'Popliteal siyatik sinir bloğu',tu:'Popliteal siyatik blok, bifurkasyon',o:LAT,
      el:[fatTop(30),['ell','m',72,94,82,40],['ell','m2',350,94,74,42],['bone','M60 196Q210 180 360 196',60,360],['ell','v',206,140,12,8],['ell','a',220,162,11,10],['ell','n',182,92,10,8],['ell','n',214,90,12,9]],
      la:'M154 92Q194 60 238 86Q242 116 196 120Q154 116 154 92Z',nd:[8,46,194,80],
      lb:[[72,98,'Biseps femoris','middle'],[350,98,'Semimembranöz / semitendinöz','middle'],[182,76,'OPS','middle'],[214,74,'TS','middle'],[222,138,'PV'],[236,166,'PA'],[210,212,'Femur','middle']],
      cap:'Popliteal kıvrımın 3–5 cm proksimalinde, bifurkasyon düzeyinde enine kesit. Tibial ve ortak peroneal sinir arter ve venin yüzeyelinde, Vloka (paranöral) kılıfı içindedir. İğne lateralden; enjektat kılıf içinde iki siniri ayırarak çevreler.',
      c:'Lineer prob, popliteal fossada transvers; lateral solda. İğne in-plane lateralden iki sinir arasına; LA kılıf içinde sinirleri ayırır.'},
    ipack:{t:'IPACK bloğu',tu:'IPACK bloğu, femur kondilleri düzeyi',o:MED,
      el:[fatTop(40),['ell','m2',90,96,90,36],['ell','m',336,96,84,36],['bone','M20 196Q90 150 170 176Q210 188 250 176Q330 150 400 196',20,400],['ell','a',214,148,12,11],['ell','v',240,138,11,8],['ell','n',206,104,10,8]],
      la:'M140 172Q210 156 280 172Q210 184 140 172Z',nd:[8,150,228,172],
      lb:[[90,100,'Semimembranöz','middle'],[336,100,'Biseps femoris','middle'],[214,151,'PA','middle'],[254,134,'PV'],[222,100,'TS'],[96,206,'Medial kondil','middle'],[330,206,'Lateral kondil','middle']],
      cap:'Diz arkasında femur kondilleri düzeyinde enine kesit. İğne medialden girer; enjektat popliteal arter ile femur arasındaki boşlukta, diz kapsülünün arkasında yayılır.',
      c:'Konveks veya lineer prob, diz arkasında transvers; medial solda. İğne in-plane medialden arter ile femur arasına; LA kapsülün arkasında yayılır.'},
    gnb:{t:'Genikülar sinir bloğu (superomedial hedef)',tu:'Genikülar sinir bloğu, superomedial',o:['proksimal','distal'],
      el:[fatTop(40),['band','m',40,96],['bone','M0 156Q150 152 240 138Q320 124 420 122',0,420],['ell','a',200,140,6,5],['ell','n',178,142,5,4]],
      la:'M150 142Q190 130 230 140Q190 150 150 142Z',nd:[40,40,186,140],
      lb:[[8,70,'Vastus medialis'],[170,132,'SMGS','end'],[208,132,'SMGA'],[90,186,'Femur metafizi','middle'],[330,170,'Medial epikondil','middle']],
      cap:'Dizin medialinde koronal kesit. Superomedial genikülar sinir femur metafiz-diyafiz bileşkesinde vastus medialis ile kemik arasında, aynı adlı arterin yanındadır; iğne kemiğe değer. Diğer hedefler: superolateral, inferolateral (lateral kollateral bağın derini) ve inferomedial (medial kollateral bağın altı).',
      c:'Lineer prob, dizin medialinde koronal; proksimal solda. Kemik kortikal çizgisi; arter Doppler ile. İğne kemik temasına kadar; LA kas ile kemik arasında.'},
    ankle:{t:'Ayak bileği bloğu: tibial sinir',tu:'Ayak bileği bloğu, tibial sinir',o:['anterior','posterior'],
      el:[fatTop(36),['line','fs','M70 60Q230 54 390 62'],['rbone',40,120,70,60],['ell','l',112,94,13,10],['ell','l',148,90,11,9],['ell','m2',262,160,74,30],['ell','l',372,100,40,20],['ell','v',188,96,6,5],['ell','a',206,92,8,8],['ell','v',224,96,6,5],['ell','n',240,106,12,9]],
      la:'M210 100Q236 84 268 98Q264 120 238 122Q210 118 210 100Z',nd:[412,40,252,102],
      lb:[[40,150,'Medial malleol','middle'],[112,80,'TP','middle'],[148,76,'FDL','middle'],[206,78,'PTA','middle'],[256,124,'TS'],[262,164,'FHL','middle'],[372,104,'Aşil','middle'],[300,52,'Fleksör retinakulum','middle']],
      cap:'Medial malleol ile Aşil tendonu arasında enine kesit. Tibial sinir fleksör retinakulumun derininde, posterior tibial arter ve venlerin posteriorundadır; en büyük ve en geç etki eden sinir olduğu için önce bloke edilir. Derin peroneal, yüzeyel peroneal, sural ve safen sinirler kendi düzeylerinde ayrıca bloke edilir.',
      c:'Lineer prob, medial malleol ile Aşil arasında enine; anterior solda. Tibial sinir arterin posteriorunda bal peteği. İğne in-plane posteriordan; LA siniri sarar; prob basıncı en az.'},
    tlip:{t:'Torakolomber interfasyal plan (TLIP) bloğu',tu:'TLIP bloğu, L3 transvers',o:['medial (orta hat)','lateral'],
      el:[fatTop(36),['line','fs','M0 46H420'],['path','b','M0 46L28 46L28 196L0 196Z'],['ell','m',86,122,58,56],['ell','m2',212,114,66,54],['ell','m',344,106,70,46],['bone','M0 196Q120 190 200 180Q320 172 420 180',0,420],['ell','n',146,166,5,4]],
      la:'M140 76Q156 118 140 160Q130 118 140 76Z',nd:[412,40,150,118],
      lb:[[14,120,'SP','middle'],[86,126,'Multifidus','middle'],[212,118,'Longissimus','middle'],[344,110,'İliokostalis','middle'],[158,170,'DR'],[300,42,'Torakolomber fasya','middle'],[220,206,'Lamina / TP','middle']],
      cap:'L3 düzeyinde orta hattın 2–3 cm lateralinde enine kesit. Klasik yaklaşımda enjektat multifidus ile longissimus arasına, modifiye yaklaşımda longissimus ile iliokostalis arasına verilir; hedef dorsal ramilerdir. Orta hat insizyonunda bilateral yapılır.',
      c:'Lineer veya konveks prob, L3 düzeyinde enine; medial solda. İğne in-plane lateralden; klasikte LA multifidus ile longissimus arasını ayırır.'},
    sgb:{t:'Stellat ganglion bloğu (C6, lateral yaklaşım)',tu:'Stellat ganglion bloğu, C6 transvers',o:MED,
      el:[fatTop(34),['ell','m',300,58,96,18],['path','p','M0 60L46 60L46 144L0 144Z'],['ell','p',84,86,48,28],['line','fs','M110 134H272'],['ell','m2',180,150,52,16],['bone','M110 176Q190 166 270 176',110,270],['rbone',304,166,20,14],['ell','a',200,92,16,16],['ell','v',252,84,22,13],['ell','a',266,186,7,6],['ell','n',176,130,7,5]],
      la:'M158 131Q200 122 242 131Q200 140 158 131Z',nd:[412,110,224,131],
      lb:[[300,62,'SKM','middle'],[84,90,'Tiroid','middle'],[23,104,'Trakea','middle'],[200,70,'KA','middle'],[252,66,'İJV','middle'],[180,156,'Longus colli','middle'],[164,124,'SZ','end'],[190,196,'C6','middle'],[278,194,'VA'],[304,150,'AT','middle']],
      cap:'C6 düzeyinde enine kesit (lateral yaklaşım). Servikal sempatik zincir longus colli kasının önünde, prevertebral fasyanın altındadır. İğne lateralden internal juguler ven ve karotisin arkasından geçer; enjektat prevertebral fasyanın altında yayılır.',
      c:'Lineer prob, C6 düzeyinde transvers; medial solda. İğne in-plane lateralden İJV ve karotisin arkasından; LA longus colli önünde, fasya altında. Tiroid ve vertebral damarlar Doppler ile kontrol edilir.'},
    spinal:{t:'Spinal anestezi (paramedian sagital oblik)',tu:'Spinal, paramedian sagital oblik (L3–L4)',o:KR,
      el:[fatTop(30),['band','m',30,104],['band','c',142,176],['bone','M20 118L120 104L130 112',20,130,134],['bone','M170 118L270 104L280 112',170,280,134],['bone','M320 118L420 104',320,420,134],['line','fs','M130 140H170'],['line','fs','M130 178H170'],['bone','M0 190H420',0,420]],
      la:'',nd:[8,30,152,160],
      lb:[[8,70,'Erector spinae'],[70,96,'Lamina','middle'],[220,96,'Lamina','middle'],[150,136,'LF + dura','middle'],[150,166,'BOS','middle'],[150,186,'Ön kompleks','middle'],[300,206,'Vertebra cismi','middle']],
      cap:'Paramedian sagital oblik kesit, kranial solda. Laminalar arasındaki pencerede posterior kompleks (ligamentum flavum ve dura) ve anterior kompleks görülür. Spinal iğne posterior kompleksi geçip intratekal boşluğa (BOS) ulaşır.',
      c:'Konveks prob, paramedian sagital oblik; kranial solda. Laminalar "testere dişi"; pencerede posterior ve anterior kompleks. Ön tarama ile orta hat, derinlik ve aralık belirlenir.'},
    epidural:{t:'Epidural (paramedian sagital oblik)',tu:'Epidural, paramedian sagital oblik (lomber)',o:KR,
      el:[fatTop(30),['band','m',30,104],['band','c',142,176],['bone','M20 118L120 104L130 112',20,130,134],['bone','M170 118L270 104L280 112',170,280,134],['bone','M320 118L420 104',320,420,134],['line','fs','M130 140H170'],['line','fs','M130 178H170'],['bone','M0 190H420',0,420]],
      la:'M136 139Q150 132 166 139Q150 144 136 139Z',nd:[8,30,148,134],
      lb:[[8,70,'Erector spinae'],[70,96,'Lamina','middle'],[220,96,'Lamina','middle'],[198,136,'LF'],[150,166,'BOS','middle'],[150,186,'Ön kompleks','middle'],[300,206,'Vertebra cismi','middle']],
      cap:'Paramedian sagital oblik kesit, kranial solda. Tuohy iğnesi direnç kaybıyla ligamentum flavumu geçer ve posterior kompleksin hemen önündeki epidural aralıkta durur.',
      c:'Konveks prob, paramedian sagital oblik; kranial solda. Ön tarama ile orta hat, derinlik ve laminalar arası pencere belirlenir; iğne gerçek zamanlı değil, ön taramaya göre ilerletilir.'}
    };
  }
  function CZDATA3(){
    return {
    fam:{t:'Önkol ortası blokları (median, ulnar, radial)',tu:'Önkol ortası, median sinir',o:['radial','ulnar'],
      el:[['band','f',8,26],['path','m','M0 26L420 26L420 70L0 70Z'],['ell','m2',110,98,104,26],['ell','m',300,100,110,28],['line','fs','M60 124Q210 116 360 124'],['ell','m2',210,150,200,24],['rbone',40,186,52,22],['rbone',380,188,52,22],['ell','n',210,122,14,7]],
      la:'M182 122Q210 108 240 122Q210 136 182 122Z',nd:[8,40,192,120],
      lb:[[8,48,'FCR / PL / FCU'],[110,102,'FDS','middle'],[300,104,'FDS','middle'],[210,154,'FDP','middle'],[210,114,'MS','middle'],[52,198,'Radius','middle'],[368,200,'Ulna','middle']],
      cap:'Önkol ortasında enine kesit. Median sinir yüzeyel (FDS) ve derin (FDP) fleksörler arasındaki fasyal planda seyreder. Ulnar sinir ulnar arterin ulnar tarafında, FCU altında; radial sinirin yüzeyel dalı radial arterin radial tarafında, brakioradialis altındadır. Her sinire 3–5 mL ayrı ayrı verilir.',
      c:'Lineer prob, önkol ortasında enine; radial solda. Median sinir FDS ile FDP arasında bal peteği görünümünde, arter eşliği yok. İğne in-plane; LA siniri çevreler. Ulnar ve radial sinir aynı düzeyde, kendi arterlerinin yanında ayrıca bloke edilir.'},
    uas:{t:'Kolda seçici sinir blokları (kol orta–üst 1/3)',tu:'Kol orta–üst 1/3, transvers',o:['lateral','medial'],
      el:[['band','f',8,26],['ell','m',140,64,140,36],['ell','m2',100,150,120,40],['rbone',150,196,56,22],['ell','a',300,96,12,11],['ell','v',330,108,10,7],['ell','n',282,84,8,6],['ell','n',326,84,7,5],['ell','n',356,72,5,4]],
      la:'M264 88Q300 66 344 84Q348 118 304 122Q264 116 264 88Z',nd:[412,40,330,86],
      lb:[[140,60,'Biseps','middle'],[100,154,'Triseps / brakiyalis','middle'],[150,214,'Humerus','middle'],[300,100,'BA','middle'],[270,78,'M','end'],[332,76,'U'],[362,66,'MAKS']],
      cap:'Kolun orta–üst üçte birinde enine kesit. Median ve ulnar sinir brakiyal arter çevresinde, medial antebrakiyal kutanöz sinir yüzeyelde bloke edilir; radial ve muskulokutan sinirler kolun daha distalinde ayrıca bloke edilir. Aksiller bloğa göre dirsekte motor blok daha azdır.',
      c:'Lineer prob, kolun medialinde transvers; lateral solda. Brakiyal arter çevresinde median ve ulnar sinir. İğne in-plane medialden; LA sinirleri arterin çevresinde ayrı ayrı sarar.'}
    };
  }
  /* ---------- Ortak geometriden çizim: kitapçık tarzı kesit + USG animasyonu ---------- */
  var CZK={m:['t-musc','kas'],m2:['t-musc2','kas'],f:['t-fat','yağ'],b:['t-bone','kemik'],n:['t-nerve','sinir'],a:['t-vessel','arter'],v:['t-vein','ven'],l:['t-lig','tendon / bağ'],lu:['t-lung','akciğer'],p:['t-peri','periton / organ'],c:['t-csf','BOS'],k:['t-cart','kıkırdak']};
  var CZLEG={m:'musc',m2:'musc',b:'bone',n:'nerve',a:'vessel',v:'vein',l:'lig',lu:'lung',p:'peri',c:'csf',k:'cart'};
  var CZU={f:sg(44),m:'url(#um1)',m2:'url(#um2)',l:'url(#ulg)',lu:sg(64),p:sg(56)};
  var USGP='<pattern id="um1" width="16" height="7" patternUnits="userSpaceOnUse"><rect width="16" height="7" fill="'+sg(84)+'"/><path d="M0 3.5Q4 2.3 8 3.5T16 3.5" stroke="'+sg(118)+'" stroke-width=".8" fill="none"/></pattern><pattern id="um2" width="16" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(8)"><rect width="16" height="7" fill="'+sg(74)+'"/><path d="M0 3.5Q4 2.3 8 3.5T16 3.5" stroke="'+sg(106)+'" stroke-width=".8" fill="none"/></pattern><pattern id="ulg" width="10" height="4" patternUnits="userSpaceOnUse"><rect width="10" height="4" fill="'+sg(132)+'"/><path d="M0 2H10" stroke="'+sg(190)+'" stroke-width=".9"/></pattern>';
  function czShape(e,cls,fill){var a=' class="'+cls+'"'+(fill?' fill="'+fill+'"':'');
    if(e[0]==='band')return '<rect x="0" y="'+e[2]+'" width="420" height="'+(e[3]-e[2])+'"'+a+'/>';
    if(e[0]==='ell')return '<ellipse cx="'+e[2]+'" cy="'+e[3]+'" rx="'+e[4]+'" ry="'+e[5]+'"'+a+'/>';
    if(e[0]==='path')return '<path d="'+e[2]+'"'+a+'/>';return ''}
  function czBoneD(e,sk){var b=(sk&&e[4])?e[4]:220;return e[0]==='bone'?e[1]+'L'+e[3]+' '+b+'L'+e[2]+' '+b+'Z':''}
  function czSk(s){var o=R(0,0,420,220,'t-fat')+R(0,0,420,8,'t-skin'),late='';
    s.el.forEach(function(e){var k=e[1];
      if(e[0]==='bone'){o+='<path d="'+czBoneD(e,1)+'" class="t-bone"/>';return}
      if(e[0]==='rbone'){o+=E(e[1],e[2],e[3],e[4],'t-bone');return}
      if(e[0]==='line'){o+='<path d="'+e[2]+'" fill="none" class="'+(k==='pl'?'czpl':'fas')+'"/>';return}
      var sh=czShape(e,CZK[k][0]);if(k==='n'||k==='a'||k==='v')late+=sh;else o+=sh});
    if(s.la)o+='<path class="la" d="'+s.la+'"/>';
    o+=late+(s.nd?N(s.nd[0],s.nd[1],s.nd[2],s.nd[3]):'')+s.lb.map(function(l){return T(l[0],l[1],l[2],l[3])}).join('')+T(8,215,s.o[0])+T(412,215,s.o[1],'end');
    var seen={},lg=[];s.el.forEach(function(e){var k=e[0]==='bone'||e[0]==='rbone'?'b':e[0]==='line'?(e[1]==='pl'?'lu':''):e[1];if(k&&k!=='f'&&!seen[CZLEG[k]]){seen[CZLEG[k]]=1;lg.push([CZLEG[k],(s.leg&&s.leg[k])||CZK[k][1]])}});
    if(s.la)lg.push(['la','lokal anestezik']);
    return '<div class="fig"><p class="ft">'+s.t+'</p><svg class="sch" viewBox="0 0 420 220" role="img" aria-label="'+s.t+' şematik kesit çizimi">'+o+'</svg>'+leg(lg)+'<p class="fc">'+s.cap+'</p></div>'}
  function czUs(s){var base='',sharp='',late='';
    s.el.forEach(function(e){var k=e[1];
      if(e[0]==='bone'){sharp+='<path d="'+czBoneD(e)+'" fill="#020202"/>'+sL(e[1],4,238);return}
      if(e[0]==='rbone'){var x1=e[1]-e[3],x2=e[1]+e[3],y=e[2],arc='M'+x1+' '+y+'A'+e[3]+' '+e[4]+' 0 0 1 '+x2+' '+y;sharp+='<path d="'+arc+'L'+x2+' 220L'+x1+' 220Z" fill="#020202"/>'+sL(arc,4,238);return}
      if(e[0]==='line'){sharp+=k==='pl'?sL(e[2],2.6,232)+'<path d="'+e[2]+'" transform="translate(0 22)" fill="none" stroke="'+sg(120)+'" stroke-width="1.4"/><path d="'+e[2]+'" transform="translate(0 44)" fill="none" stroke="'+sg(90)+'" stroke-width="1.2"/>':sL(e[2],1.6,196);return}
      if(k==='n'){late+=sNerve(e[2],e[3],e[4],e[5]);return}
      if(k==='a'){late+=sVes(e[2],e[3],e[4],e[5],1);return}
      if(k==='v'){late+=sVn(e[2],e[3],e[4],e[5]);return}
      if(k==='c'){sharp+=czShape(e,'','#040404');return}
      if(k==='k'){sharp+=czShape(e,'',sg(34)).replace('/>',' stroke="'+sg(175)+'" stroke-width="1.3"/>');return}
      base+=czShape(e,'',CZU[k]||sg(60))});
    var la=s.la?'<path class="ula" d="'+s.la+'" fill="#030303" stroke="'+sg(150)+'" stroke-width=".8"/>':'';
    var tk='';for(var y=20;y<220;y+=20)tk+='<circle cx="414" cy="'+y+'" r="'+(y%100?1:1.8)+'" fill="#bbb"/>';
    return '<div class="fig"><p class="ft">USG animasyonu · '+s.tu+'</p><svg class="usgsv" viewBox="0 0 420 220" role="img" aria-label="'+s.tu+', USG benzetimi: iğne ilerleyişi ve lokal anestezik yayılımı"><defs>'+USGF+USGP+'</defs><rect width="420" height="220" fill="#000"/><g filter="url(#usgbl)"><rect width="420" height="220" fill="'+sg(44)+'"/>'+base+'</g><rect width="420" height="220" filter="url(#usgsp)" opacity=".5"/>'+sL('M0 4H420',3,205)+sharp+la+late+(s.nd?sN(s.nd[0],s.nd[1],s.nd[2],s.nd[3]):'')+tk+s.lb.map(function(l){return sT(l[0],l[1],l[2],l[3])}).join('')+sT(6,212,s.o[0])+sT(406,212,s.o[1],'end')+'</svg><p class="fc">'+s.c+' Şematik benzetimdir, gerçek hasta görüntüsü değildir.</p></div>'}
  var CZ=Object.assign(CZDATA(),CZDATA2(),CZDATA3());USGRX.push(['fam',/nkol ortasında/],['uas',/olda seçici/]);
  Object.keys(CZ).forEach(function(k){ANIM[k]=function(){return czSk(CZ[k])}});
  function usgLinks(k){var a=USGFIG[k];if(!a)return usgSim(k);return usgSim(k)+'<div class="src" style="margin:4px 0 12px"><b>Gerçek USG görüntüsü (açık erişim makale şekli):</b><ul class="notes" style="margin-top:4px">'+a.map(function(l){return '<li><a href="'+l[1]+'" target="_blank" rel="noopener">'+esc(l[0])+'</a></li>'}).join('')+'</ul></div>'}
  USGIMG.forEach(function(b){var q=USGGOOG[b[0]]||(b[0]+' ultrasound guided block needle');b[1].push(['Google Görseller araması: '+b[0]+' (USG ve iğne görüntüsü; görsel hakkı sahibine ait olabilir, kaynak ve lisansı doğrulamadan kopyalamayın)','https://www.google.com/search?tbm=isch&q='+encodeURIComponent(q)])});
  function renderImg(){
    $('p-img').innerHTML='<h2>USG ve Doppler görüntüleri</h2><p class="src" style="margin:6px 0 10px">Görüntüler sayfaya gömülmedi: yapıt dış sunuculardan resim yükleyemez ve şekillerin çoğu yayıncı lisansına tabidir. "USG şekli" ile başlayan bağlantılar doğrudan ilgili makale şekline gider. Telifli ve kaynaksız görüntü eklemedim, Bloklar için eklenen gri tonlu çizimler özgün şematik USG benzetimleridir, gerçek hasta görüntüsü değildir. Her blok için doldurulacak bir yuva ve PubMed Central\'daki ilgili makalelere bağlantı var. Şekil kullanımı için lisansı (CC BY, CC BY-NC vb.) makale sayfasında doğrulayın veya kendi/izinli görüntülerinizi yükleyin. Doppler ayrımı (damar yapıları) için notlar görüntü sahibi tarafından girilmelidir.</p>'+
      USGIMG.map(function(b){return '<div style="border:1px solid var(--line,#8884);border-radius:8px;padding:10px 12px;margin:0 0 10px"><b>'+esc(b[0])+'</b>'+
        usgRow(b[0],'<div style="border:1px dashed var(--line,#8886);border-radius:6px;padding:14px;margin:8px 0;text-align:center" class="src">USG görüntüsü: yüklenmedi · Doppler klibi: yüklenmedi</div>')+
        '<div class="src">Dosya: — · Lisans: — · Kaynak/izin: — · Probe konumu: — · Doppler notu: —</div>'+
        '<ul class="notes" style="margin-top:8px">'+b[1].map(function(l){return '<li><a href="'+l[1]+'" target="_blank" rel="noopener">'+esc(l[0])+'</a> <span class="src">PMC, tam metin; şekil lisansı doğrulanmalı</span></li>'}).join('')+'</ul></div>'}).join('')}
  function renderPng(){
    var by={},order=[];PGB.forEach(function(r){if(!by[r[0]]){by[r[0]]=[];order.push(r[0])}by[r[0]].push(r)});
    $('p-png').innerHTML='<h2>PENG bloğu (pericapsular nerve group)</h2><p class="src" style="margin:6px 0 10px">PubMed taraması: başlıkta PENG ve pericapsular nerve group (403 kayıttan meta-analiz, randomize çalışma, olgu serisi ve bildirimleri seçildi; hepsi taranmadı). Kılavuz önerisi değildir; kanıt etiketi sayfadaki kurala göre. Olumsuz sonuçlu çalışmalar da dahil. Birçok çalışma bloğun kuadriseps zayıflığına yol açabildiğini ve hacim ve konsantrasyonun ayarlanması gerektiğini ele alıyor.</p>'+
      order.map(function(k){return '<h3 class="grp">'+esc(k)+'</h3><ul class="notes">'+by[k].map(function(r){return '<li>'+esc(r[1])+' <span class="chip na">'+esc(r[2])+'</span><br>'+src(PRO[r[3]])+'</li>'}).join('')+'</ul>'}).join('')}
  var CRD=D.CRD;
  var CRDSRC=D.CRDSRC;
  Object.keys(CRDSRC).forEach(function(k){PRO[k]={t:CRDSRC[k][0],u:CRDSRC[k][1]}});
  var CRDNOTE=D.CRDNOTE;
  var FIBD=D.FIBD;
  var FIBSRC=D.FIBSRC;
  Object.keys(FIBSRC).forEach(function(k){PRO[k]={t:FIBSRC[k][0],u:FIBSRC[k][1]}});
  var FIBNOTE=D.FIBNOTE;
  function renderFib(){
    var by={},order=[];FIBD.forEach(function(r){if(!by[r[0]]){by[r[0]]=[];order.push(r[0])}by[r[0]].push(r)});
    $('p-fib').innerHTML='<h2>Fasiya iliaka bloğu: cerrahi kapsamı</h2><p class="src" style="margin:6px 0 10px">'+esc(FIBNOTE)+'</p>'+
      order.map(function(k){return '<h3 class="grp">'+esc(k)+'</h3><ul class="notes">'+by[k].map(function(r){return '<li>'+esc(r[1])+' <span class="chip na">'+esc(r[2])+'</span><br>'+src(PRO[r[3]])+'</li>'}).join('')+'</ul>'}).join('')}
  function renderCrd(){
    var by={},order=[];CRD.forEach(function(r){if(!by[r[0]]){by[r[0]]=[];order.push(r[0])}by[r[0]].push(r)});
    $('p-crd').innerHTML='<h2>Kalp cerrahisi ve kateter laboratuvarı: ESP, TTP, PENG</h2><p class="src" style="margin:6px 0 10px">'+esc(CRDNOTE)+'</p>'+
      order.map(function(k){return '<h3 class="grp">'+esc(k)+'</h3><ul class="notes">'+by[k].map(function(r){return '<li>'+esc(r[1])+' <span class="chip na">'+esc(r[2])+'</span><br>'+src(PRO[r[3]])+'</li>'}).join('')+'</ul>'}).join('')}
  function renderTfb(){
    var by={},order=[];TFB.forEach(function(r){if(!by[r[0]]){by[r[0]]=[];order.push(r[0])}by[r[0]].push(r)});
    $('p-tfb').innerHTML='<h2>Transversalis fasya plan bloğu (TFPB)</h2><p class="src" style="margin:6px 0 10px">Obstetride (sezaryen) en çok çalışılan alan. PubMed taraması: başlıkta "transversalis fascia plane block" kayıtları (44 kayıttan okunabilenler); olgu serisi ve bildirimleri ayrıca listelendi. Kılavuz önerisi değildir; kanıt etiketi sayfadaki kurala göre. Olumsuz sonuçlu çalışmalar da dahil.</p>'+
      order.map(function(k){return '<h3 class="grp">'+esc(k)+'</h3><ul class="notes">'+by[k].map(function(r){return '<li>'+esc(r[1])+' <span class="chip na">'+esc(r[2])+'</span><br>'+src(PRO[r[3]])+'</li>'}).join('')+'</ul>'}).join('')}
  function renderGrk(){
    var by={},order=[];GRK.forEach(function(r){if(!by[r[0]]){by[r[0]]=[];order.push(r[0])}by[r[0]].push(r)});
    $('p-grk').innerHTML='<h2>Yavuz Gürkan (Koç Üniversitesi) yayınları ve güncel blok yazıları</h2><p class="src" style="margin:6px 0 10px">PubMed taraması: "Gurkan Y", "Gürkan Yavuz" ve "Yavuz Gürkan" yazar aramaları ve Koç Üniversitesi bağlantılı sorgu; DOI\'si olmayan kayıtlar (PMC tam metni de yoksa) alınmadı; yalnızca ilk adı Yavuz olan veya ters yazımlı kayıtlar alındı (eski dönem çoğunlukla Kocaeli Üniversitesi). Mektup ve başyazılar yalnız başlık düzeyinde, diğerleri özet düzeyinde okundu; tam metin okunmadı. Ad benzerliği olabilir. Kanıt etiketi sayfadaki kurala göre; olgu bildirimleri Zayıf.</p>'+
      order.map(function(k){return '<h3 class="grp">'+esc(k)+'</h3><ul class="notes">'+by[k].map(function(r){return '<li>'+esc(r[1])+' <span class="chip na">'+esc(r[2])+'</span><br>'+src(PRO[r[3]])+'</li>'}).join('')+'</ul>'}).join('')}
  function renderNew(){
    $('p-new').innerHTML='<h2>Yeni nesil fasiyal plan blokları: Tulgar ve Çiftçi yayınları</h2><p class="src" style="margin:6px 0 10px">PubMed taraması, yazar adlarıyla. Çalışmaların çoğu bloğu geliştiren grubundan çıkıyor; bağımsız tekrar bu taramada bulunmadı. Kanıt etiketi sayfadaki kurala göre (RCT ve meta-analiz Güçlü, olgu bildirimi ve küçük seri Zayıf).</p>'+
      NEWB.map(function(b){return '<h3 class="grp">'+esc(b[0])+'</h3><p class="src">'+esc(b[1])+'</p><ul class="notes">'+b[2].map(function(r){return '<li><b>'+esc(r[0])+'</b> <span class="chip na">'+esc(r[1])+'</span><br>'+src(PRO[r[2]])+'</li>'}).join('')+'</ul>'}).join('')}
  function renderAll(){renderImg();renderCrd();renderFib();renderPng();renderTfb();renderGrk();renderNew();renderBlock();renderAcg();renderCom();renderSrc();renderFoot();renderOrig()}

  ['reg','appr'].forEach(function(id){$(id).addEventListener('change',function(){fillProc();renderAll()})});
  ['proc','acg','crcl','last'].concat(COMIDS.map(function(c){return 'c-'+c})).forEach(function(id){$(id).addEventListener('input',renderAll);$(id).addEventListener('change',renderAll)});
  $('p-block').addEventListener('click',function(e){
    var b=e.target.closest&&e.target.closest('.play');if(!b)return;
    var k=b.getAttribute('data-k');openAnim[k]=!openAnim[k];renderBlock();
  });

  /* ---------- Sekmeler ---------- */
  var TABS=['guide','dose','safe','ver'];
  function show(w){TABS.forEach(function(t){$('view-'+t).hidden=(t!==w);$('tab-'+t).setAttribute('aria-selected',String(t===w));$('tab-'+t).tabIndex=(t===w)?0:-1})}
  TABS.forEach(function(t,i){var b=$('tab-'+t);b.addEventListener('click',function(){show(t)});b.addEventListener('keydown',function(e){var k=e.key,n=null;if(k==='ArrowRight'||k==='ArrowDown')n=TABS[(i+1)%TABS.length];else if(k==='ArrowLeft'||k==='ArrowUp')n=TABS[(i+TABS.length-1)%TABS.length];else if(k==='Home')n=TABS[0];else if(k==='End')n=TABS[TABS.length-1];if(n){e.preventDefault();show(n);$('tab-'+n).focus()}})});

  /* ---------- Doğrulama kaydı ---------- */
  var VS={ok:['rec','Doğrulandı'],part:['opt','Kısmen'],no:['no','Doğrulanamadı'],x:['na','Not']};
  var VER=D.VER;
  $('verlist').innerHTML=VER.map(function(v){var s=VS[v[0]];return '<li class="v"><span class="chip '+s[0]+'">'+s[1]+'</span><div><b>'+esc(v[1])+'</b></div><div class="d">'+esc(v[2])+'</div></li>'}).join('');

  function safeList(L){return '<ul class="notes" style="margin-top:10px">'+L.map(function(r){return '<li><b>'+esc(r[0])+':</b> '+esc(r[1])+(PRO[r[2]]?'<br><span class="src">'+src(PRO[r[2]])+'</span>':'')+'</li>'}).join('')+'</ul>'}
  function renderSafe(){
    $('p-dose').innerHTML='<div class="sec-h"><h2>Lokal anestezik en yüksek dozları</h2><span class="src">Erişkin, tek doz. Yaşlı, kırılgan, gebe ve organ yetmezliği olan hastada ve çoklu blokta daha düşük doz hedefleyin.</span></div>'+safeList(D.DOSE||[]);
    $('p-safe').innerHTML='<div class="sec-h"><h2>Güvenlik</h2><span class="src">Toplam doz, LAST tedavisi, enjeksiyon basıncı ve kompartman sendromu.</span></div>'+safeList(D.SAFE||[])}
  showMeta(D.__meta);
  fillProc();renderAll();renderSafe();


}
(window.__DATA?Promise.resolve(window.__DATA):Promise.all(DATA_FILES.map(function(f){return fetch('data/'+f+'.json').then(function(r){if(!r.ok)throw new Error(f);return r.json()})}))).then(function(arr){
  var D={__meta:[]};arr.forEach(function(x){D.__meta.push(x._meta);for(var k in x.data)D[k]=x.data[k]});
  APP(D);
}).catch(function(e){document.body.insertAdjacentHTML('afterbegin','<p style="padding:16px;color:#A92F2A">İçerik dosyası yüklenemedi: '+e.message+'. Uygulamayı bir web sunucusu üzerinden açın.</p>')});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&!window.Capacitor){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}

