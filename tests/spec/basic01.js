describe("Basic QualifiedName", function() {
	beforeEach(function() {
	});
	it("QualifiedName create", function() {
		var qname1 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		expect(qname1).toBeDefined();
		expect(qname1.prefix).toBe("ex");
		expect(qname1.localPart).toBe("foo");
		expect(qname1.uri).toBe("http://www.example.com/foo");
	});
	// TODO: Add tests for invalid qnames
	it("QualifiedName equals", function() {
		var qname1 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		var qname2 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		expect(qname1.equals(qname2)).toBeTruthy();
		expect(qname2.equals(qname1)).toBeTruthy();
	});
	it("QualifiedName equals different prefix", function() {
		var qname1 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		var qname2 = new prov.QualifiedName("fu", "foo", "http://www.example.com/");
		expect(qname1.equals(qname2)).toBeTruthy();
	});
	it("QualifiedName not equals localpart", function() {
		var qname1 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		var qname2 = new prov.QualifiedName("ex", "bar", "http://www.example.com/");
		expect(qname1.equals(qname2)).toBeFalsy();
	});
	it("QualifiedName not equals namespace", function() {
		var qname1 = new prov.QualifiedName("ex", "foo", "http://www.example.com/");
		var qname2 = new prov.QualifiedName("fu", "foo", "http://www.anotherexample.com/");
		expect(qname1.equals(qname2)).toBeFalsy();
	});
	it("QualifiedName not equals same concat path", function() {
		var qname1 = new prov.QualifiedName("ex", "bah/foo", "http://www.example.com/");
		var qname2 = new prov.QualifiedName("fu", "foo", "http://www.example.com/bah/");
		expect(qname1.equals(qname2)).toBeFalsy();
	});
});
