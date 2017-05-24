import * as THREE from 'three';
import './CSS3DRenderer';
import './Projector';

var _width, _height;
var _widthHalf, _heightHalf;
var _projector = new THREE.Projector();
var _tmpMatrix = new THREE.Matrix4();

var _vector3 = new THREE.Vector3();
var _viewProjectionMatrix = new THREE.Matrix4();
var _viewMatrix = new THREE.Matrix4();

export default class CSS3DRendererIE {


    constructor(el) {

        this.init(el);
    }

    init(el) {

        // attach to existing element or create a new one
        this.domElement = el || document.createElement('div');

        this.domElement.style.overflow = 'hidden';
        this.setStyle(this.domElement, 'perspectiveOrigin', '50% 50% 0');
        this.setStyle(this.domElement, 'transformOrigin', '50% 50% 0');
    };

    getObjects(list, node) {

        node.updateMatrixWorld();
        list.push(node);
        for (var i = 0; i < node.children.length; i++) {
            this.getObjects(list, node.children[i]);
        }
    };

    render(scene, camera) {

        camera.matrixWorldInverse.getInverse(camera.matrixWorld)
        camera.updateMatrixWorld();
        var fov = 0.5 / Math.tan(THREE.Math.degToRad(camera.getEffectiveFOV() * 0.5)) * _height;

        this.setStyle(this.domElement, 'perspective', fov + "px");

        var objects = [];

        this.getObjects(objects, scene);

        var view_matrix =
            "translate3d(-50%, -50%, 0) " +
            "translate3d(" + _widthHalf + "px," + _heightHalf + "px, " + fov + "px) " +
            this.getCameraCSSMatrix(camera.matrixWorldInverse);
        for (var i = 0, il = objects.length; i < il; i++) {

            var object = objects[i];

            // console.log(THREE.CSS3DObject);

            if (object instanceof THREE.CSS3DObject) {

                var element = object.element;

                // If element is destroyed, stop append him
                if (element !== null) {
                    if (element.parentNode !== this.domElement) {
                        this.domElement.appendChild(element);
                    }
                }



                if (object['visible'] !== false) {
                    if (object.wasVisible === false) {
                        element.style.visibility = 'visible';
                        object.wasVisible = true;
                    }

                    if (object instanceof THREE.CSS3DSprite) {

                        // http://swiftcoder.wordpress.com/2008/11/25/constructing-a-billboard-matrix/

                        _tmpMatrix.copy(camera.matrixWorldInverse);
                        _tmpMatrix.transpose();
                        _tmpMatrix.copyPosition(object.matrixWorld);
                        _tmpMatrix.scale(object.scale);

                        _tmpMatrix.elements[3] = 0;
                        _tmpMatrix.elements[7] = 0;
                        _tmpMatrix.elements[11] = 0;
                        _tmpMatrix.elements[15] = 1;

                    } else {

                        _tmpMatrix.copy(object.matrixWorld);
                    }

                    if (element !== null) {
                    	this.setStyle(element, 'transform', view_matrix + this.getObjectCSSMatrix(_tmpMatrix));
                    }

                    


                    // apply depth sorting.
                    // element.style.zIndex = Math.round( getMatrixForElement( element ).elements[14] * 1000 );

                } else {
                    if (object.wasVisible !== false) {
                        element.style.visibility = 'hidden';
                        object.wasVisible = false;
                    }
                }
            }

        }

    };


    setSize(width, height) {

        _width = width;
        _height = height;

        _widthHalf = _width / 2;
        _heightHalf = _height / 2;

        this.domElement.style.width = width + 'px';
        this.domElement.style.height = height + 'px';

    };

    epsilon(value) {

        return Math.abs(value) < 0.000001 ? 0 : value.toFixed(10);

    };

    // apply prefixed styles to dom element
    setStyle(el, name, value, prefixes) {

        prefixes = prefixes || ["Webkit", "Moz", "O", "Ms"];
        var n = prefixes.length;

        while (n--) {
            var prefix = prefixes[n];
            el.style[prefix + name.charAt(0).toUpperCase() + name.slice(1)] = value;
            el.style[name] = value;
        }

    };

    // get prefixed computed css property
    getComputedProperty(element, property_name) {

        var computedStyle = window.getComputedStyle(element, null);

        return computedStyle.getPropertyValue(property_name) ||
            computedStyle.getPropertyValue('-webkit-' + property_name) ||
            computedStyle.getPropertyValue('-moz-' + property_name) ||
            computedStyle.getPropertyValue('-o-' + property_name) ||
            computedStyle.getPropertyValue('-ms-' + property_name);

    };

    // returns Matrix4 representing the currently applied CSS3 transform
    getMatrixForElement(element) {

        var matrix = new THREE.Matrix4();
        var matrix_elements = this.getComputedProperty(element, 'transform').replace('matrix3d(', '').replace(')', '').split(',');
        matrix_elements = matrix_elements.map(function(n) {
            return Number(n);
        });
        matrix.set.apply(matrix, matrix_elements);
        matrix.transpose();
        return matrix;

    };

    getCameraCSSMatrix(matrix) {

        var elements = matrix.elements;

        return 'matrix3d(' +
            this.epsilon(elements[0]) + ',' +
            this.epsilon(-elements[1]) + ',' +
            this.epsilon(elements[2]) + ',' +
            this.epsilon(elements[3]) + ',' +
            this.epsilon(elements[4]) + ',' +
            this.epsilon(-elements[5]) + ',' +
            this.epsilon(elements[6]) + ',' +
            this.epsilon(elements[7]) + ',' +
            this.epsilon(elements[8]) + ',' +
            this.epsilon(-elements[9]) + ',' +
            this.epsilon(elements[10]) + ',' +
            this.epsilon(elements[11]) + ',' +
            this.epsilon(elements[12]) + ',' +
            this.epsilon(-elements[13]) + ',' +
            this.epsilon(elements[14]) + ',' +
            this.epsilon(elements[15]) +
            ') ';

    };

    getObjectCSSMatrix(matrix) {

        var elements = matrix.elements;

        return 'matrix3d(' +
            this.epsilon(elements[0]) + ',' +
            this.epsilon(elements[1]) + ',' +
            this.epsilon(elements[2]) + ',' +
            this.epsilon(elements[3]) + ',' +
            this.epsilon(-elements[4]) + ',' +
            this.epsilon(-elements[5]) + ',' +
            this.epsilon(-elements[6]) + ',' +
            this.epsilon(-elements[7]) + ',' +
            this.epsilon(elements[8]) + ',' +
            this.epsilon(elements[9]) + ',' +
            this.epsilon(elements[10]) + ',' +
            this.epsilon(elements[11]) + ',' +
            this.epsilon(elements[12]) + ',' +
            this.epsilon(elements[13]) + ',' +
            this.epsilon(elements[14]) + ',' +
            this.epsilon(elements[15]) +
            ') ';

    };

    // detect support for transfor-style: preserve-3d
    // var hasPreserve3d () {

    //   // create test element
    //   var test_el = document.createElement('div' );
    //   test_el.style.display = 'none';
    //   this.setStyle( test_el, 'transformStyle', 'preserve-3d');

    //   // add to body so we can get computed style
    //   document.getElementsByTagName('body')[0].appendChild( test_el );
    //   var val = this.getComputedProperty(test_el, 'transform-style');
    //   test_el.parentElement.removeChild( test_el );

    //   return val == 'preserve-3d';

    // }


};
