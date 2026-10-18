const fs = require('fs');

// Test logic
function testAliases() {
  const tests = [
    { input: "venta more paper", expected: "More Paper" },
    { input: "cierre papelería", expected: "More Paper" },
    { input: "mope", expected: "More Paper" },
    { input: "venta more design", expected: "More Design" },
    { input: "venta amor design", expected: "More Design" },
    { input: "cierre de diseno", expected: "More Design" },
    { input: "cierre diseño", expected: "More Design" },
    { input: "more desing", expected: "More Design" },
    { input: "amordesign", expected: "More Design" }
  ];

  tests.forEach((t, i) => {
    const tAcomp = String(t.input || "").toLowerCase().replace(/[\s_-]/g, "");
    let entidad = null;
    if (tAcomp.includes("paper") || tAcomp.includes("morepaper") || tAcomp.includes("mopepaper") || tAcomp.includes("mope") || tAcomp.includes("papeleria") || tAcomp.includes("papelería") || tAcomp.includes("papel")) {
      entidad = "More Paper";
    } else if (tAcomp.includes("design") || tAcomp.includes("moredesign") || tAcomp.includes("desing") || tAcomp.includes("moredesing") || tAcomp.includes("amordesign") || tAcomp.includes("diseno") || tAcomp.includes("diseño") || tAcomp.includes("agencia") || tAcomp.includes("publicidad")) {
      entidad = "More Design";
    }
    console.log(`Test ${i + 1} [${t.input}] -> ${entidad} (${entidad === t.expected ? 'PASS' : 'FAIL'})`);
    if (entidad !== t.expected) throw new Error(`Test failed for ${t.input}`);
  });
}

testAliases();
console.log('✅ ALL ALIAS TESTS PASSED!');
