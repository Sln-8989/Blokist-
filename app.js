

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
    'limb-closed':'Alt ekstremitede kapalı (artroskopik) cerrahi için özet eklenmedi.'
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
  function leg(items){return '<div class="leg">'+items.map(function(i){return '<span><i style="background:var(--'+SW[i[0]]+')"></i>'+i[1]+'</span>'}).join('')+'<span><i style="background:var(--fg)"></i>iğne</span></div>'}
  function fig(title,svgInner,caption,legend){return '<div class="fig"><p class="ft">'+title+'</p><svg viewBox="0 0 420 220" role="img" aria-label="'+title+' şematik çizimi">'+svgInner+'</svg>'+leg(legend)+'<p class="fc">'+caption+'</p></div>'}
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
      LA(208,104,38,22)+N(40,34,214,98),
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
  var ANAME={esp:'ESP',tap:'TAP',fib:'Fasya iliaka',acb:'Aduktör kanal',spinal:'Spinal',epidural:'Epidural',pvb:'Paravertebral'};

  /* ---------- Seçiciler ---------- */
  var acgSel=$('acg');
  ACG.forEach(function(a){
    if(a.g){var og=document.createElement('optgroup');og.label=a.g;acgSel.appendChild(og);return}
    var o=document.createElement('option');o.value=a.id;o.textContent=a.label;
    (a.id==='none'?acgSel:acgSel.lastChild.tagName==='OPTGROUP'?acgSel.lastChild:acgSel).appendChild(o);
  });
  function current(){var id=acgSel.value;return ACG.filter(function(a){return a.id===id})[0]}
  function acgFor(a){var c=$('crcl').value;var renal=a.renal&&(a.renalLt50?(c!=='ge50'):(c==='lt30'));return {h:renal&&a.hRenal?a.hRenal:a.h,renal:renal}}
  function procList(){var r=$('reg').value,p=$('appr').value;return Object.keys(PROC).filter(function(k){return PROC[k].reg===r&&PROC[k].ap===p})}
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
    if(on('copd')&&(it.tech==='periph'||it.tech==='plane')&&/interskalen|supraklav|infraklav|aksiller/i.test(it.n))o+='<div class="cm"><b>KOAH:</b> diyafram tutulumu riskini düşünün.</div>';
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
    var it=o.it,key=pk+':'+o.ix,ak=it.anim||[],uk=usgKeys(it.n).filter(function(k){return ak.indexOf(k)<0}),hasA=(ak.length||uk.length)&&(it.s==='rec'||it.s==='opt'),bl=ak.length?'Animasyonu':'USG görünümünü';
    return '<li class="opt"><span class="chip '+it.s+'">'+ST[it.s]+'</span><div><span class="nm">'+esc(it.n)+'</span><span class="tag">'+TECH[it.tech]+'</span>'+(top?'<span class="chip top">en güçlü kanıt</span>':'')+'</div><div class="ev">Kanıt düzeyi: '+esc(o.ev.t)+'</div><div class="why">'+esc(it.w)+'</div>'+
      (it.s==='rec'||it.s==='opt'?acLine(it,a):'')+cmLines(it)+
      (hasA?'<button type="button" class="play" data-k="'+key+'" aria-expanded="'+(openAnim[key]?'true':'false')+'">'+(openAnim[key]?bl+' gizle':bl+' göster')+'</button>'+(openAnim[key]?'<div class="anim">'+ak.map(function(k){return ANIM[k]()+usgLinks(k)}).concat(uk.map(usgLinks)).join('')+'</div>':''):'')+'</li>';
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
      var avail=Object.keys(PROC).map(function(x){return PROC[x].name+' ('+(PROC[x].ap==='open'?'açık':'kapalı')+')'}).join(', ');
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
  function sN(x1,y1,x2,y2){return '<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="#fafafa" stroke-width="2.2" stroke-linecap="round"/><circle cx="'+x2+'" cy="'+y2+'" r="2.4" fill="#fff"/>'}
  function sLA(d){return '<path d="'+d+'" fill="#030303" stroke="'+sg(150)+'" stroke-width=".8"/>'}
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
  function usgSim(k){var s=USGS[k];if(!s)return '';var cp=s.clip?' clip-path="url(#usgc-'+k+')"':'';
    return '<div class="fig"><p class="ft">USG benzetimi · '+s.t+'</p><svg viewBox="0 0 320 220" role="img" aria-label="'+s.t+', şematik USG benzetimi"><defs>'+USGF+(s.clip?'<clipPath id="usgc-'+k+'"><path d="'+s.clip+'"/></clipPath>':'')+'</defs><rect width="320" height="220" fill="#000"/><g'+cp+'><g filter="url(#usgbl)">'+s.a+'</g><rect width="320" height="220" filter="url(#usgsp)" opacity=".5"/>'+s.b+'</g>'+USGTK+s.l+'</svg><p class="fc">'+s.c+' Şematik benzetimdir, gerçek hasta görüntüsü değildir.</p></div>'}
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
      b:sSk()+sL('M0 24H320',1.3,165)+sL('M0 70H320',1.6,180)+sL('M0 106H320',1.6,180)+sLA('M132 140Q132 184 164 186Q196 184 196 150Q186 172 164 172Q144 170 140 140Z')+sVes(162,140,16,15,1)+sVn(210,150,14,11)+sNerve(138,122,8,6)+sNerve(166,170,8,6)+sNerve(186,156,7,5)+sN(8,30,162,174),
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
    spsip:{t:'SPSIP bloğu',c:'Lineer prob, skapula medial kenarında 2–3. kaburga üzerinde oblik; kranial solda. LA serratus posterior superior kası ile kaburga arasına verilir; trapez ve romboid yüzeyeldedir.',
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
    rifpb:{t:'Rektointerkostal fasiyal plan bloğu (RIFPB)',c:'Lineer prob, 6–7. kostal kıkırdaklar üzerinde parasagital, rektus lateral kenarına yakın; kranial solda. LA rektus abdominis ile interkostal kaslar arasındaki plana verilir.',
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
  var USGRX=[['mtapa',/M-TAPA/],['rifpb',/ektointerkostal|RIFPB/i],['rsb',/ektus kılıf/i],['eoi',/\bEOI\b|xternal oblique intercostal/i],['spsip',/SPSIP/],['rib',/omboid interkostal|\(RIB\)/i],['pecs',/PECS|nterpektoral|pektoserratus|Torasik duvar/i],['sap',/erratus anterior/i],['ql1',/uadratus lumborum|\bQL\b/i],['ql2',/uadratus lumborum|\bQL\b/i],['ql3',/uadratus lumborum|\bQL\b/i],['tfpb',/ransversalis fasya|TFPB/i],['peng',/PENG/],['isb',/nterskalen/i],['scb',/upraklavik/i],['icb',/nfraklavik/i],['axb',/ksiller brakiyal|infraklaviküler, aksiller/i],['ssn',/uprascapular/i],['esp',/\bESP\b|rector spinae/i],['tap',/\bTAP\b/],['pvb',/aravertebral/i],['fib',/fasya iliaka/i],['acb',/d+uktör kanal/i]];
  function usgKeys(n){return USGRX.filter(function(r){return r[1].test(n)}).map(function(r){return r[0]})}
  function usgRow(n,ph){var rk=Object.keys(USGMAP).filter(function(k){return USGMAP[k]===n});usgKeys(n).forEach(function(k){if(rk.indexOf(k)<0)rk.push(k)});return rk.length?'<div class="anim">'+rk.map(usgSim).join('')+'</div>':ph}
  var USGKEY={};
  Object.keys(USGMAP).forEach(function(k){if(!USGKEY[USGMAP[k]])USGKEY[USGMAP[k]]=k});
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
  var TABS=['guide','ver'];
  function show(w){TABS.forEach(function(t){$('view-'+t).hidden=(t!==w);$('tab-'+t).setAttribute('aria-selected',String(t===w))})}
  TABS.forEach(function(t){$('tab-'+t).addEventListener('click',function(){show(t)})});

  /* ---------- Doğrulama kaydı ---------- */
  var VS={ok:['rec','Doğrulandı'],part:['opt','Kısmen'],no:['no','Doğrulanamadı'],x:['na','Not']};
  var VER=D.VER;
  $('verlist').innerHTML=VER.map(function(v){var s=VS[v[0]];return '<li class="v"><span class="chip '+s[0]+'">'+s[1]+'</span><div><b>'+esc(v[1])+'</b></div><div class="d">'+esc(v[2])+'</div></li>'}).join('');

  showMeta(D.__meta);
  fillProc();renderAll();


}
(window.__DATA?Promise.resolve(window.__DATA):Promise.all(DATA_FILES.map(function(f){return fetch('data/'+f+'.json').then(function(r){if(!r.ok)throw new Error(f);return r.json()})}))).then(function(arr){
  var D={__meta:[]};arr.forEach(function(x){D.__meta.push(x._meta);for(var k in x.data)D[k]=x.data[k]});
  APP(D);
}).catch(function(e){document.body.insertAdjacentHTML('afterbegin','<p style="padding:16px;color:#A92F2A">İçerik dosyası yüklenemedi: '+e.message+'. Uygulamayı bir web sunucusu üzerinden açın.</p>')});
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&!window.Capacitor){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})})}

