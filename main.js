
    let draftedPlayers = [];
    let remainingPlayers = [];
    let currentTeamIndex = 0;
    let direction = 1;
	let subPickOrder = [];
	let subPickIndex = 0;
	let phase = "assign";
	

	function initializeSubSnakeOrder() {
	  const sorted = [...teams].sort((a, b) => a.order - b.order);
	  const totalRounds = 2; // každému týmu vybíráme 2 suby
	  for (let i = 0; i < totalRounds; i++) {
		const round = i % 2 === 0 ? sorted : [...sorted].reverse();
		subPickOrder.push(...round);
	  }
	}
	
    function loadDataFiles() {
      const remainingFile = document.getElementById('remainingFile').files[0];
      const draftedFile = document.getElementById('draftedFile').files[0];

      if (!remainingFile || !draftedFile) return alert("❌ Nahraj oba soubory (draftnutí i zbylí hráči).");

      const reader1 = new FileReader();
      const reader2 = new FileReader();

      reader1.onload = function(ev) {
        draftedPlayers = JSON.parse(ev.target.result);
        reader2.onload = function(ev2) {
          remainingPlayers = JSON.parse(ev2.target.result);
          teams.forEach(t => t.subs = []);

          document.querySelector('.file-upload').style.display = 'none';
          document.getElementById('team-logo').style.display = 'block';
          document.querySelector('.sub-container').style.display = 'flex';
          document.getElementById('sub1-box').style.display = 'block';
	      document.getElementById('sub2-box').style.display = 'block';
		  document.getElementById('assign-button-wrapper').style.display = 'block';

          updateUI();
        };
		
		if (!window._selectListenersSetup) {
		  setupSingleSelectExclusivity();
		  window._selectListenersSetup = true;
		}

        reader2.readAsText(remainingFile);
		initializeSubSnakeOrder();

      };
      reader1.readAsText(draftedFile);
    }

function updateUI() {
  const team = subPickOrder[subPickIndex];

  document.getElementById("team-logo").src = team.logo;
  document.getElementById("captain-name").textContent = `Kapitán: ${team.captain.name}`;

  // Výpočet budgetových pravidel
  const drafted = draftedPlayers.filter(p => p.team?.toLowerCase() === team.name.toLowerCase());
  const prices = drafted.map(p => p.price).sort((a, b) => b - a);
  const top3 = prices.slice(0, 3);
  const thirdMostExpensive = top3.length === 3 ? top3[2] : top3[top3.length - 1] || Infinity;
  const minPrice = prices.length > 0 ? Math.min(...prices) : Infinity;

  // Zápis pouze při prvním vstupu týmu do draftu
	if (phase === "assign") {
      team._sub1Cap = thirdMostExpensive;
	  team._minPrice = minPrice;
	}

  // Sub boxy
  const sub1Box = document.getElementById("sub1-display");
  const sub2Box = document.getElementById("sub2-display");

  if (team.subs[0]) {
    sub1Box.innerHTML = `${team.subs[0].name}<br><span style="font-size:20px;">${team.subs[0].price.toFixed(0)} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;"></span>`;
  } else {
	sub1Box.innerHTML = `≤ ${team._sub1Cap || '---'} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;">`;
  }

  if (team.subs[1]) {
    sub2Box.innerHTML = `${team.subs[1].name}<br><span style="font-size:20px;">${team.subs[1].price.toFixed(0)} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;"></span>`;
  } else {
    sub2Box.innerHTML = `≤ 350 & ≤ ${team._minPrice || '---'} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;">`;
  }

  // Selectboxy
  const sub1Select = document.getElementById("sub1-select");
  const sub2Select = document.getElementById("sub2-select");
	const label1 = document.querySelector("label[for='sub1-select']");
	const label2 = document.querySelector("label[for='sub2-select']");
	if (label1) label1.style.display = sub1Select.style.display;
	if (label2) label2.style.display = sub2Select.style.display;
	sub1Select.selectedIndex = -1;
	sub2Select.selectedIndex = -1;


  sub1Select.innerHTML = '';
  sub2Select.innerHTML = '';

  // Naplnění možností
if (phase === "assign") {
  remainingPlayers.forEach((p, idx) => {
    if (!team.subs[0] && p.price <= team._sub1Cap) {
      const opt1 = document.createElement("option");
      opt1.value = idx;
      opt1.text = `${p.name} - ${p.price}`;
      sub1Select.appendChild(opt1);
    }

    if (!team.subs[1] && p.price <= 350 && p.price <= team._minPrice) {
      const opt2 = document.createElement("option");
      opt2.value = idx;
      opt2.text = `${p.name} - ${p.price}`;
      sub2Select.appendChild(opt2);
    }
  });
}



  // Zobrazit/skrýt podle stavu
	const hasSub1 = !!team.subs[0];
	const hasSub2 = !!team.subs[1];

	// Pokud má tým 2 suby = nemá se už co vybírat
	const isComplete = hasSub1 && hasSub2;

	// Výchozí nastavení
	sub1Select.style.display = "none";
	sub2Select.style.display = "none";
	label1.style.display = "none";
	label2.style.display = "none";

	// Pokud zbývá jen Sub 1
	if (!hasSub1 && hasSub2) {
	  sub1Select.style.display = "block";
	  label1.style.display = "block";
	}
	// Pokud zbývá jen Sub 2
	else if (hasSub1 && !hasSub2) {
	  sub2Select.style.display = "block";
	  label2.style.display = "block";
	}
	// Pokud nemá žádného suba (např. první kolo)
	else if (!hasSub1 && !hasSub2) {
	  sub1Select.style.display = "block";
	  label1.style.display = "block";
	  sub2Select.style.display = "block";
	  label2.style.display = "block";
	}

}

    
function assignSub() {
	console.log(`Team index: ${subPickIndex}/${subPickOrder.length}, phase: ${phase}`);

  const team = subPickOrder[subPickIndex];

  // Fáze "next" = čekáme na kliknutí "Další"
if (phase === "next") {
  phase = "assign";
  subPickIndex++;

  if (subPickIndex >= subPickOrder.length) {
    console.log("🎉 Draft subů dokončen.");
    return showRecap();
  }

  document.querySelector("#assign-button").textContent = "Přiřadit";
  updateUI();
  return;
}


  const sub1Select = document.getElementById("sub1-select");
  const sub2Select = document.getElementById("sub2-select");

  const sub1Selected = sub1Select.selectedIndex >= 0;
  const sub2Selected = sub2Select.selectedIndex >= 0;

  // Zajistit výběr pouze jednoho hráče
  if (sub1Selected && sub2Selected) {
    alert("❌ Vyber pouze jednoho hráče – buď Sub 1 nebo Sub 2.");
    return;
  }

  if (!sub1Selected && !sub2Selected) {
    alert("❌ Nevybral jsi žádného hráče.");
    return;
  }

  const subIdx = parseInt(sub1Selected ? sub1Select.value : sub2Select.value);
  const subCandidate = remainingPlayers[subIdx];

  if (!subCandidate) {
    alert("❌ Vybraný hráč nebyl nalezen.");
    return;
  }

  // Validace a přiřazení
  if (sub1Selected) {
	if (subCandidate.price > team._sub1Cap) {
	  alert(`❌ Hráč je dražší než 3. nejdražší hráč v týmu (${team._sub1Cap.toFixed(0)} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;">).`);
	  return;
	}
    team.subs[0] = subCandidate;
  } else if (sub2Selected) {
    if (subCandidate.price > 350 || subCandidate.price > team._minPrice) {
      alert(`❌ Hráč nesplňuje podmínky ≤ 350 & ≤ ${team._minPrice.toFixed(0)} <img src="icons/be.webp" alt="BE" style="height: 18px; vertical-align: middle;">.`);
      return;
    }
    team.subs[1] = subCandidate;
  }

  // Odebrat hráče z výběru
  remainingPlayers.splice(subIdx, 1);

  // Přechod do fáze "Další"
  phase = "next";
  document.querySelector("#assign-button").textContent = "Další";
  updateUI();
}



function setupSingleSelectExclusivity() {
  const sub1 = document.getElementById("sub1-select");
  const sub2 = document.getElementById("sub2-select");

  if (!sub1 || !sub2) return;

  // Reset druhého selectu při výběru v jednom
  sub1.addEventListener("change", () => {
    if (sub1.selectedIndex >= 0) sub2.selectedIndex = -1;
  });

  sub2.addEventListener("change", () => {
    if (sub2.selectedIndex >= 0) sub1.selectedIndex = -1;
  });
}


    function showRecap() {
      document.body.innerHTML = '<h1 style="text-align:center; color:white">Subové přiřazeni!</h1>';
      console.log("Finální týmy se suby:", teams);
    }