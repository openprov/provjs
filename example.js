/**
 * Example usages of the ProvJS library
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

var prov = require("./prov");

// Register a namespace
var ex = prov.addNamespace("ex", "http://www.example.org/");

var e1 = prov.entity("ex:e1");
e1.attr("ex:foo", ex.qname("bar"))
  .attr("ex:baz", ["abc", "xsd:string"])
  .attr("ex:bah", ["1", "xsd:integer"])
  .attr("ex:bam", ["bam", undefined, "en"])
  .attr("ex:bam", prov.literal("bam", undefined, "en"));
console.log(e1);
console.log("" + e1);

var e2 = prov.entity("ex:e2")
	.attr("ex:dat", new Date(Date.now()))
	.attr("ex:int", 1)
	.attr("ex:nint", -1)
	.attr("ex:flt", 1.02)
	.attr("ex:str", "def")
	.attr("ex:bool", true);
console.log(e2);

var der1 = prov.wasDerivedFrom("ex:e2", "ex:e1")
	.attr("prov:type", ["prov:Revision", "xsd:QName"])
	.id(ex.qname('d1'));
console.log(der1.getContext());
console.log("" + der1);

console.log(der1.attr("prov:type"));

var der2 = prov.wasDerivedFrom("ex:e2", "ex:e1", "prov:type", prov.ns.qname("Revision"));
console.log(der2);
console.log("" + der2);

var attr1 = prov.wasAttributedTo("ex:e1", "ex:ag");
console.log(attr1.getContext());

var doc = prov.buildDocument();
var provjson = doc.buildPROVJSON();
console.log(JSON.stringify(provjson, null, "  "));