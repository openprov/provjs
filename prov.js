/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */


(function( window, undefined ) {

// URI
function URI(uri) {
	this.uri = uri;
}

URI.prototype.getURI = function() {
	return this.uri;
};


// PROV Qualified Name
function QualifiedName(prefix, localPart, namespaceURI) {
	this.prefix = prefix;
	this.localPart = localPart;
	this.namespaceURI = namespaceURI;
	URI.call(this, namespaceURI + localPart);
}

QualifiedName.prototype = Object.create(URI.prototype);
QualifiedName.prototype.constructor = QualifiedName;
QualifiedName.prototype.toString = function() {
	var ret = this.prefix + ":" + this.localPart;
	return ret;
};
QualifiedName.prototype.equals = function(other) {
	return ((other instanceof QualifiedName) && (this.uri==other.uri));
};


// Namespace
function Namespace(prefix, namespaceURI) {
	this.prefix = prefix;
	this.namespaceURI = namespaceURI;
}

Namespace.prototype.qname = function(localPart) {
	var ret = new QualifiedName(this.prefix, localPart, this.namespaceURI);
	return ret;
};

// Literal and data types
function Literal(value, datatype, langtag) {
	this.value = value;
	this.datatype = datatype;
	this.langtag = langtag;
}
Literal.prototype.constructor = Literal;
Literal.prototype.toString = function() {
	// TODO Suport for multi-line strings (triple-quoted)
	return ('"' + this.value + '"' +
			((this.langtag !== undefined) ? ('@' + this.langtag) : (' %% ' + this.datatype)));
};
Literal.prototype.equals = function(other) {
	// TODO check whether this is correct or is too strict
	return (   (other instanceof Literal)
	        && (this.value===other.value)
	        && (this.datatype===other.datatype)
	        && (this.langtag===other.langtag) );
};

// Record
function Record() {
	this.attributes = [];
}
Record.prototype = {
	id: function(identifier) {
		this.identifier = identifier;
		return this;
	},
	getId: function() {
		return this.id;
	},
	set_attr: function(k, v){
		var i;
		var existing = false;
		var values = this.get_attr(k);
		for(i=0; i<values.length; i++) {
			if (v.equals(values[i])) {
				existing = true;
				continue;
			}
		}
		if (!existing) {
			this.attributes.push([k,v]);
		}
	},
	get_attr: function(attr_name) {
		var results = [];
		var i;
		for (i = 0; i < this.attributes.length; i++) {
			if (attr_name.equals(this.attributes[i][0])) {
				results.push(this.attributes[i][1]);
			}
		}
		return results;
	},
	// TODO: setters and getters for prov:type, prov:label, prov:value, prov:location, prov:role
};
 


// Element
function Element(identifier) {
	Record.call(this);
	this.identifier = identifier;
}
Element.prototype = Object.create(Record.prototype);
Element.prototype.constructor = Element;

// Entity
function Entity(identifier) {
	Element.call(this, identifier);
}
Entity.prototype = Object.create(Element.prototype);
Entity.prototype.constructor = Entity;
Entity.prototype.toString = function() {
	var output = [];
	output.push(String(this.identifier));
	var attr = this.attributes.map(function(x) {
		return x.join("=");
		}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return "entity(" + output.join(", ") + ")";
};
// TODO: decide on whether to support Plan

// TODO: Agent
// Subclass Element

// TODO: Activity
// Subclass Element
// startTime, endTime
// TODO: decide on whether to support Person, Organization, SoftwareAgent

// Relation
function Relation()
{
	var i;
	Record.call(this);
	for(i=0; i<this.relations.length; i++) {
		this[this.relations[i]] = null;
	}
}
Relation.prototype = Object.create(Record.prototype);
Relation.prototype.constructor = Relation;
Relation.prototype.toString = function() {
	var that = this;
	var output = [];
	if (this.identifier) {
		output.push(String(this.identifier) + "; " + this[this.from]);
	} else {
		output.push(this[this.from]);
	}
	output.push(this[this.to]);
	var rel = this.relations.map(function(x) {
		return (that[x]) ? that[x] : "";
	}).join(", ");
	if (rel.split(", ").join("") !== "") {
		output.push(rel);
	}
	var attr = this.attributes.map(function(x) {
		return x.join("=");
	}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return this.relation_name + "(" + output.join(", ") + ")";
};

// TODO: Generation
// TODO: Usage
// TODO: Communication
// TODO: Start
// TODO: End
// TODO: Invalidation
//
// Derivation
function Derivation(generatedEntityID, usedEntityID) {
	Relation.call(this);
	this.generatedEntityID = generatedEntityID;
	this.usedEntityID = usedEntityID;
}
Derivation.prototype = Object.create(Relation.prototype);
Derivation.prototype.constructor = Derivation;
Derivation.prototype.relations = ['activity', 'generation', 'usage'];
Derivation.prototype.relation_name = 'wasDerivedFrom';
Derivation.prototype.from = 'generatedEntityID';
Derivation.prototype.to = 'usedEntityID';

// TODO: decide on whether to support special cases for Revision, Quotation, PrimarySource

// TODO: Attribution
// TODO: Association
// TODO: Delegation
// TODO: Influence
// TODO: Alternate
// TODO: Specialization
// TODO: Membership

// TODO: Bundles

function Document() {
	// This is a provanance document
}

var provNS = new Namespace("prov", "http://www.w3.org/ns/prov#");
var xsdNS = new Namespace("xsd", "http://www.w3.org/2000/10/XMLSchema#");

// Utility class
function ProvJS() {
}

ProvJS.prototype = {
	namespaces: {
		"prov": provNS,
		"xsd": xsdNS
	},
	ns: provNS,
		
	constructor: ProvJS,
	addNamespace: function(ns_or_prefix, uri) {
		var ns;
		if (ns_or_prefix instanceof Namespace) {
			ns = ns_or_prefix;
		} else {
			ns = new Namespace(ns_or_prefix, uri);
		}
		this.namespaces[ns.prefix] = ns;
		return ns;
	},
	getValidQualifiedName: function(identifier) {
		if (identifier instanceof QualifiedName) {
			return identifier;
		}

		// If id_str has a colon (:), check if the part before the colon is a registered prefix
		var components = identifier.split(":", 2);
		if (components.length === 2) {
			var prefix = components[0];
			if (prefix in this.namespaces) {
				return this.namespaces[prefix].qname(components[1]);
			}
		}
			
		// TODO If a default namespace is registered, use it

		console.error("Cannot validate identifier:", identifier);
		return identifier;
	},
	literal: function(value, datatype, langtag) {
		if ((datatype===undefined) && (langtag===undefined)) {
			if (typeof value === "string") {
				datatype = xsdNS.qname("string");
			} else
			if (typeof value === 'number') {
				if (Math.floor(value) === value) {
					datatype = xsdNS.qname("int");
				} else {
					datatype = xsdNS.qname("float");
				}
			} else
			if (typeof value === 'boolean') {
					datatype = xsdNS.qname("boolean");
			} else
			if (value instanceof Date) {
				value = value.toISOString();
				datatype = xsdNS.qname("dateTime");
			}
		} else {
			if (datatype!==undefined) {
				datatype = this.getValidQualifiedName(datatype);
			}
		}
		var ret = new Literal(value, datatype, langtag);
		return ret;
	},
	// PROV statements
	entity: function(identifier) {
		return new Entity(this.getValidQualifiedName(identifier));
	},
	wasDerivedFrom: function() {
		var pos,result;
		var l = arguments.length;
		if (l < 2) {
			return null;
		}
		result = new Derivation(this.getValidQualifiedName(arguments[0]), this.getValidQualifiedName(arguments[1]));
		if (l > 2) {
			for (pos = 3; pos < l; pos += 2) {
				result.set_attr(this.getValidQualifiedName(arguments[pos - 1]), arguments[pos]);
			}
		}
		return result;
	}
	// TODO Collect all created records
	// TODO Construct documents and bundles
};

// This is the default ProvJS object
var rootProvJS = new ProvJS();

// Registering the prov object with the environment
if (typeof module === "object" && module && typeof module.exports === "object") {
	// Common.JS environments (e.g. node.js, PhantomJS)
	module.exports = rootProvJS;
} else {
	// Asynchronous module definition (AMD)
	if (typeof define === "function" && define.amd) {
		define( "prov", [], function () { return rootProvJS; } );
	}
}

if (typeof window === "object" && typeof window.document === "object") {
	// Browser environments
	window.prov = rootProvJS;
}

})(window);
