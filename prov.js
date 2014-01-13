/**
 * JavaScript library for PROV.
 * 
 * Copyright 2013 University of Southampton - All rights reserved.
 * Licence: To be determined
 */

/*jshint strict: true */

(function(window, undefined) {
	"use strict";

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
	return ((other instanceof QualifiedName)
	        && (this.namespaceURI===other.namespaceURI)
	        && (this.localPart===other.localPart)
	       );
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
	// TODO Check for special notation for some data types in PROV-N (e.g. QName)
	return ('"' + this.value + '"' +
			((this.langtag !== undefined) ? ('@' + this.langtag) : (' %% ' + this.datatype)));
};
Literal.prototype.equals = function(other) {
	// TODO check whether this is correct or is too strict
	return ((other instanceof Literal)
	        && (this.value===other.value)
	        && (this.datatype===other.datatype)
	        && (this.langtag===other.langtag) );
};

// Record
function Record() {
    // Parsing the optional attribute-value pairs if the last argument is a list
	this.attributes = [];
    var len = arguments.length;
    if (len > 1 && arguments[len - 1] instanceof Array) {
        // Requiring at least 3 arguments (record-specific first term, an array)
        var attrPairs = arguments[len - 1];
        for (var i = 0, l = attrPairs.length; i < l; i += 2) {
            requireQualifiedName(attrPairs[i]);
            this.setAttr(attrPairs[i], attrPairs[i + 1]);
        }
    }
}
Record.prototype = {
	/* GETTERS & SETTERS */
	// Identifier
	id: function(identifier) {
		this.identifier = identifier;
		return this;
	},
	getId: function() {
		return this.identifier;
	},
	setAttr: function(k, v){
		var i;
		var existing = false;
		var values = this.getAttr(k);
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

	// Arbitrary attributes
	getAttr: function(attr_name) {
		var results = [];
		for (var i = 0; i < this.attributes.length; i++) {
			if (attr_name.equals(this.attributes[i][0])) {
				results.push(this.attributes[i][1]);
			}
		}
		return results;
	}
};
 


// Element
function Element(identifier) {
	Record.apply(this, arguments);
	this.identifier = identifier;
}
Element.prototype = Object.create(Record.prototype);
Element.prototype.constructor = Element;

// Entity
function Entity(identifier) {
	Element.apply(this, arguments);
}
Entity.prototype = Object.create(Element.prototype);
Entity.prototype.constructor = Entity;
Entity.prototype.provn_name = "entity";
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
function Relation() {
    var len = arguments.length;
    if (len > 0) {
        // Processing relation terms
        if (arguments[len - 1] instanceof Array) {
            // Assuming this is the array of attribute-value pairs, ignore it
            len--;
        }
        var terms = this.getPROVTerms();
        for (var i = 0; i < len; i++) {
            this[terms[i]] = arguments[i];
        }
    }
	Record.apply(this, arguments);
}
Relation.prototype = Object.create(Record.prototype);
Relation.prototype.constructor = Relation;
Relation.prototype.toString = function() {
	var that = this;
	var output = [];
    var provTerms = this.getPROVTerms();
    var term0 = this[provTerms[0]]; // The first term should always available
	if (this.identifier) {
		output.push(String(this.identifier) + "; " + term0);
	} else {
		output.push(term0);
	}
	var rel = provTerms.slice(1).map(function(x) {
		return (that[x]) ? that[x] : "-";
	}).join(", ");
    output.push(rel);

	var attr = this.attributes.map(function(x) {
		return x.join("=");
	}).join(", ");
	if (attr !== "") {
		output.push("["+attr+"]");
	}
	return this.provn_name + "(" + output.join(", ") + ")";
};

// Validation functions
// TODO These validation function currently does not allow for reporting which value is offending the rules
function requireQualifiedName(value) {
    if (!(value instanceof QualifiedName)) {
        throw new Error("Expected a prov.QualifiedName value");
    }
}
function requireDate(value) {
    if (!(value instanceof Date)) {
        throw new Error("Expected a Date value");
    }
}

function defineProp(obj, propName, validator) {
    if (obj.properties === undefined) {
        obj.properties = {};
    }
    obj.properties[propName] = undefined;
    Object.defineProperty(obj, propName, {
        get: function () {
            return this.properties[propName];
        },
        set: function (newValue) {
            validator(newValue);
            this.properties[propName] = newValue;
        }
    })
}

function definePROVRelation(cls, provn_name, from, to, extras) {
    var proto = Object.create(Relation.prototype);
    proto.constructor = cls;
    proto.provn_name = provn_name;
    var provTerms = [from, to];
    // The first two terms are always required to be QualifiedName
    defineProp(proto, from, requireQualifiedName);
    defineProp(proto, to, requireQualifiedName);
    if (extras !== undefined) {
        for (var i = 0; i < extras.length; i++) {
            var term = extras[i];
            provTerms.push(term[0]);
            defineProp(proto, term[0], term[1]);
        }
    }
    Object.freeze(provTerms); // Prevent this array from being modified
    proto.getPROVTerms = function () {
        return provTerms; // returning the array above to avoid the same array being duplicated in every relation of the same type
    }
    cls.prototype = proto;
    return cls;
}

// TODO: Generation
// TODO: Usage
// TODO: Communication
// TODO: Start
// TODO: End
// TODO: Invalidation
// TODO: decide on whether to support special cases for Revision, Quotation, PrimarySource

function Derivation(generatedEntity, usedEntity) {
    Relation.apply(this, arguments);
}

definePROVRelation(Derivation,
    "wasDerivedFrom", "generatedEntity", "usedEntity", [
        ["activity", requireQualifiedName],
        ["generation", requireQualifiedName],
        ["usage", requireQualifiedName]
    ]
);
function Attribution(entity, agent) {
    Relation.apply(this, arguments);
}
definePROVRelation(Attribution,
    "wasAttributedTo", "entity", "agent"
);

// TODO: Association
// TODO: Delegation
// TODO: Influence
// TODO: Alternate
// TODO: Specialization
// TODO: Membership

// TODO: Bundles
var uniqueIDCount = 0;
function getUniqueID(obj) {
    // Generating unique identifiers for PROV-JSON export
    var ret;
    if (obj.getId !== undefined && (ret = obj.getId()) !== undefined) {
        // Return the existing identifier
        return ret.toString();
    }
    if (obj.__provjson_id === undefined) {
        obj.__provjson_id = "_:id" + (++uniqueIDCount);

    }
    return obj.__provjson_id;
}

function Document(statements) {
    this.statements = statements.slice(); // Cloning the list of statements
    // TODO Collect all namespaces used in various QualifiedName to define in the prefix block
    // This can also be done in when a document is exported to PROV-N or PROV-JSON
}

Document.prototype = {
    constructor: Document,
    buildPROVJSON: function () {
        // TODO implement following _encode_JSON_container()
        // (See https://github.com/trungdong/prov/blob/master/prov/model/__init__.py#L1375)
        var container = {};
        for (var i = 0, l = this.statements.length; i < l; i++) {
            var statement = this.statements[i];
            var id = getUniqueID(statement);
            var stJSON = {};
            if (statement instanceof Relation) {
                var terms = statement.getPROVTerms();
                for (var j = 0; j < terms.length; j++) {
                    if (statement[terms[j]] !== undefined) {
                        stJSON["prov:" + terms[j]] = statement[terms[j]].toString();
                    }
                }
            }
            // TODO Export attribute-value pairs (and startTime, endTime for activities)
            if (container[statement.provn_name] === undefined) {
                container[statement.provn_name] = {};
            }
            container[statement.provn_name][id] = stJSON;
        }
        return container;
    }
};

var provNS = new Namespace("prov", "http://www.w3.org/ns/prov#");
var xsdNS = new Namespace("xsd", "http://www.w3.org/2000/10/XMLSchema#");
xsdNS.QName = xsdNS.qname("QName");

// Factory class
function ProvJS(scope, parent) {
	// The factory class
    this.scope = (scope !== undefined) ? scope : new Bundle(); // TODO: Should this create a new document instead?
    this.parent = parent;
}

function Bundle() {
	this.statements = new Array();
}

Bundle.prototype = {
	constructor: Bundle,

	addStatement: function(statement) {
		this.statements.push(statement);
	},
};

ProvJS.prototype = {
    // Exposing classes via the ProvJS class
	URI: URI,
	QualifiedName: QualifiedName,
	Literal: Literal,
	Record: Record,
	Element: Element,
	Entity: Entity,
	Relation: Relation,
	Derivation: Derivation,
	Attribution: Attribution,

    // All registered namespaces
	namespaces: {
		"prov": provNS,
		"xsd": xsdNS
	},
	// The PROV namespace
	ns: provNS,
	parent: undefined,
	constructor: ProvJS,

	addNamespace: function(ns_or_prefix, uri) {
		var ns;
		if (ns_or_prefix instanceof Namespace) {
			ns = ns_or_prefix;
		} else {
			ns = new Namespace(ns_or_prefix, uri);
		}
        var namespaces = (this.scope instanceof Record) ? this.parent.namespaces : this.namespaces;
		namespaces[ns.prefix] = ns;
		return ns;
	},
	getValidQualifiedName: function(identifier) {
		if (identifier instanceof QualifiedName) {
			return identifier;
		}

        var namespaces = (this.scope instanceof Record) ? this.parent.namespaces : this.namespaces;

		// If id_str has a colon (:), check if the part before the colon is a registered prefix
		var components = identifier.split(":", 2);
		if (components.length === 2) {
			var prefix = components[0];
			if (prefix in namespaces) {
				return namespaces[prefix].qname(components[1]);
			}
		}
			
		// TODO If a default namespace is registered, use it

		throw new Error("Cannot validate identifier:", identifier);
		return identifier;
	},
	literal: function(value, datatype, langtag) {
		// Determine the data type for common types
		if ((datatype === undefined) && (langtag === undefined)) {
			// Missing both datatype and langtag
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
			} else
			if (value instanceof QualifiedName) {
				datatype = xsdNS.QName;
			}
		} else {
			if (datatype !== undefined) {
				datatype = this.getValidQualifiedName(datatype);
				
				if (datatype.equals(xsdNS.QName)) {
					// Try to ensure a QualifiedName value
					value = this.getValidQualifiedName(value);
				}
			}
			// TODO Handle with langtag and undefined datatype
		}
		var ret = new Literal(value, datatype, langtag);
		return ret;
	},
	getValidLiteral: function(literal) {
		if (literal instanceof Literal) {
			return literal;
		}
		var ret;
		if (Array.isArray(literal)) {
			// Accepting literal as an array of [value, datatype, lang]
			ret = this.literal.apply(this, literal);
		}
		else
			// Accepting literal as a simple-type value 
			ret = this.literal(literal);
		return ret;
	},

	// PROV statements
    addStatement: function(statement) {
        // Add the statement to the current bundle
        var bundle = (this.scope instanceof Record) ? this.parent.scope : this.scope;
        bundle.addStatement(statement);
    },

	entity: function(identifier) {
        var eID = this.getValidQualifiedName(identifier);
        if (this.scope instanceof Record) {
            // Setting the entity attribute
            this.scope.entity = eID;
            return this;
        }
        else {
            var newEntity = new Entity(eID);
            this.addStatement(newEntity);
            var newProvJS = new ProvJS(newEntity, this);
            return newProvJS;
        }

	},
    // TODO: similar to the above for agent
    // TODO: similar to the above for activity

	wasDerivedFrom: function() {
		var statement;
		var l = arguments.length;
		if (l < 2) {
			return undefined;
		}
		statement = new Derivation(this.getValidQualifiedName(arguments[0]), this.getValidQualifiedName(arguments[1]));
		if (l > 2) {
			for (var pos = 3; pos < l; pos += 2) {
				statement.setAttr(this.getValidQualifiedName(arguments[pos - 1]), this.getValidLiteral(arguments[pos]));
			}
		}
		this.addStatement(statement);
		var newProvJS = new ProvJS(statement, this);
        return newProvJS;
	},
    wasAttributedTo: function(entity, agent) {
        var statement = new Attribution(this.getValidQualifiedName(entity), this.getValidQualifiedName(agent));
        // TODO Handle optional attribute-value pairs
        this.addStatement(statement);
        var newProvJS = new ProvJS(statement, this);
        return newProvJS;
    },
    // Setting properties
    attr: function(attr_name, attr_value) {
		var context = this.scope;
		if (context===undefined) {
			return(undefined);
		}
		if (attr_value === undefined) {
    		// Overloading this with getter behaviour
			return context.getAttr(this.getValidQualifiedName(attr_name));
		}
		var name = this.getValidQualifiedName(attr_name);
		var value = this.getValidLiteral(attr_value);
		context.setAttr(name, value);
		return this;
	},
	id: function() {
		var context = this.scope;
		if (context === undefined) {
			return(undefined);
		}
		if (arguments.length == 0) {
			return context.id();
		} else {
			context.id(this.getValidQualifiedName(arguments[0]));
			return(this);
		}
	},

	// TODO prov:label
	// TODO prov:type
	// TODO prov:value
	// TODO prov:location
	// TODO prov:role

	// TODO Collect all created records
	toString: function() {
        if (this.scope instanceof Record)
            return 'ProvJS(' + this.scope + ')';
        else
		    return 'ProvJS(' + this.scope.statements.join(", ") + ')';
	},

    // newDocument: function() {
    // 	init(this, )
    // 	return new ProvJS();
    // },

//    newBundle: function() {
//    	var bundleW = new ProvJS();
//     	bundleW.init(new Bundle(), this);
//     	return bundleW;
//    },

    bundle: function() {
        return new ProvJS(new Bundle(), this);
    },
    document: function() {
        // return a ProvJS that wraps around a new document

    },
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
