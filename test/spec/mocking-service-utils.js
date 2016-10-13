'use strict';

describe('Mocking Service Utils', function () {
  var ramlParserAdapter, mockingServiceUtils;

  angular.module('mockingServiceUtilsTest', ['ramlEditorApp']);
  beforeEach(module('mockingServiceUtilsTest'));

  beforeEach(inject(function ($injector) {
    ramlParserAdapter = $injector.get('ramlParserAdapter');
    mockingServiceUtils = $injector.get('mockingServiceUtils');
  }));

  describe('parse RAML', function () {
    it('should dereference type', function (done) {
      var file = {
        name: 'api.raml',
        path: '/api.raml',
        contents: [
          '#%RAML 1.0',
          'title: My RAML',
          'uses:',
          '  lib: library.raml',
          '/myResource:',
          '  get:',
          '    body:',
          '      application/json:',
          '        type: lib.MyType'
        ].join('\n')
      };

      var lib = {
        name: 'library.raml',
        path: '/library.raml',
        contents: [
          '#%RAML 1.0',
          'title: My Lib',
          'types:',
          '  MyType:',
          '    properties:',
          '      name: string',
          '      address: string'
        ].join('\n')
      };

      ramlParserAdapter.loadPathUnwrapped('/api.raml', function (path) {
        var content;
        if (path === file.path) { content = file.contents; }
        if (path === lib.path) { content = lib.contents; }

        return Promise.resolve(content ? content : '');
      }).then(function (api) {
          var raml = ramlParserAdapter.expandApiToJSON(api, true);
          raml.title.should.be.equal('My RAML');
          raml.types[0]['lib.MyType'].name.should.be.equal('MyType');
          raml.resources[0].methods[0].body['application/json'].type[0].should.be.equal('lib.MyType');
          return raml;
        }
      ).then(function (raml) {
        mockingServiceUtils.dereference(raml);
        raml.resources[0].methods[0].body['application/json'].type[0].should.be.equal('object');
        raml.resources[0].methods[0].body['application/json'].properties.name.type[0].should.be.equal('string');
        raml.resources[0].methods[0].body['application/json'].properties.address.type[0].should.be.equal('string');

        done();
      }).catch(function (error) {
        expect(error).to.be.undefined();
        done();
      });
    });

  });
});
