// Generated by CoffeeScript 1.3.3
(function() {
  var arrayToJson, csvToArray,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  window.plugins.factory = {
    emit: function(div, item) {
      var show_menu;
      div.append('<p>Double-Click to Edit<br>Drop Text or Image to Insert</p>');
      show_menu = function() {
        var info, menu, name, _i, _len, _ref, _ref1, _results, _results1;
        menu = div.find('p').append("<br>Or Choose a Plugin");
        wiki.log('show menu', div, item, menu);
        if (Array.isArray(window.catalog)) {
          _ref = window.catalog;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            info = _ref[_i];
            _results.push(menu.append("<li><a href='#' title='" + info.title + "'>" + info.name + "</a></li>"));
          }
          return _results;
        } else {
          _ref1 = window.catalog;
          _results1 = [];
          for (name in _ref1) {
            info = _ref1[name];
            _results1.push(menu.append("<li><a href='#' title='" + info.menu + "'>" + name + "</a></li>"));
          }
          return _results1;
        }
      };
      if (window.catalog != null) {
        wiki.log('have menu', window.catalog);
        return show_menu();
      } else {
        wiki.log('fetching menu', window.catalog);
        return $.getJSON('/system/factories.json', function(data) {
          window.catalog = data;
          wiki.log('fetched menu', window.catalog);
          return show_menu();
        });
      }
    },
    bind: function(div, item) {
      var syncEditAction;
      syncEditAction = function() {
        var pageElement;
        wiki.log('item', item);
        div.empty().unbind();
        div.removeClass("factory").addClass(item.type);
        pageElement = div.parents('.page:first');
        try {
          div.data('pageElement', pageElement);
          div.data('item', item);
          wiki.getPlugin(item.type, function(plugin) {
            plugin.emit(div, item);
            return plugin.bind(div, item);
          });
        } catch (err) {
          div.append("<p class='error'>" + err + "</p>");
        }
        return wiki.pageHandler.put(pageElement, {
          type: 'edit',
          id: item.id,
          item: item
        });
      };
      div.dblclick(function() {
        div.removeClass('factory').addClass(item.type = 'paragraph');
        div.unbind();
        return wiki.textEditor(div, item);
      });
      div.find('a').click(function(evt) {
        div.removeClass('factory').addClass(item.type = evt.target.text.toLowerCase());
        div.unbind();
        return wiki.textEditor(div, item);
      });
      div.bind('dragenter', function(evt) {
        return evt.preventDefault();
      });
      div.bind('dragover', function(evt) {
        return evt.preventDefault();
      });
      return div.bind("drop", function(dropEvent) {
        var dt, found, ignore, origin, punt, readFile, url;
        punt = function(data) {
          wiki.log('punt', dropEvent);
          item.type = 'data';
          item.text = "Unexpected Item";
          item.data = data;
          return syncEditAction();
        };
        readFile = function(file) {
          var majorType, minorType, reader, _ref;
          if (file != null) {
            _ref = file.type.split("/"), majorType = _ref[0], minorType = _ref[1];
            reader = new FileReader();
            if (majorType === "image") {
              reader.onload = function(loadEvent) {
                item.type = 'image';
                item.url = loadEvent.target.result;
                item.caption || (item.caption = "Uploaded image");
                return syncEditAction();
              };
              return reader.readAsDataURL(file);
            } else if (majorType === "text") {
              reader.onload = function(loadEvent) {
                var array, result;
                result = loadEvent.target.result;
                if (minorType === 'csv') {
                  item.type = 'data';
                  item.columns = (array = csvToArray(result))[0];
                  item.data = arrayToJson(array);
                  item.text = file.fileName;
                } else {
                  item.type = 'paragraph';
                  item.text = result;
                }
                return syncEditAction();
              };
              return reader.readAsText(file);
            } else {
              return punt({
                number: 1,
                name: file.fileName,
                type: file.type
              });
            }
          } else {
            return punt({
              number: 2,
              types: dropEvent.originalEvent.dataTransfer.types
            });
          }
        };
        dropEvent.preventDefault();
        if ((dt = dropEvent.originalEvent.dataTransfer) != null) {
          if ((dt.types != null) && (__indexOf.call(dt.types, 'text/uri-list') >= 0 || __indexOf.call(dt.types, 'text/x-moz-url') >= 0)) {
            url = dt.getData('URL');
            if (found = url.match(/^http:\/\/([a-zA-Z0-9:.-]+)(\/([a-zA-Z0-9:.-]+)\/([a-z0-9-]+(_rev\d+)?))+$/)) {
              wiki.log('drop url', found);
              ignore = found[0], origin = found[1], ignore = found[2], item.site = found[3], item.slug = found[4], ignore = found[5];
              if ($.inArray(item.site, ['view', 'local', 'origin']) >= 0) {
                item.site = origin;
              }
              return $.getJSON("http://" + item.site + "/" + item.slug + ".json", function(remote) {
                wiki.log('remote', remote);
                item.type = 'reference';
                item.title = remote.title || item.slug;
                item.text = remote.synopsis || remote.story[0].text || remote.story[1].text || 'A recently found federated wiki site.';
                return syncEditAction();
              });
            } else {
              return punt({
                number: 4,
                url: url,
                types: dt.types
              });
            }
          } else if (__indexOf.call(dt.types, 'Files') >= 0) {
            return readFile(dt.files[0]);
          } else {
            return punt({
              number: 5,
              types: dt.types
            });
          }
        } else {
          return punt({
            number: 6,
            trouble: "no data transfer object"
          });
        }
      });
    }
  };

  csvToArray = function(strData, strDelimiter) {
    var arrData, arrMatches, objPattern, strMatchedDelimiter, strMatchedValue;
    strDelimiter = strDelimiter || ",";
    objPattern = new RegExp("(\\" + strDelimiter + "|\\r?\\n|\\r|^)" + "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" + "([^\"\\" + strDelimiter + "\\r\\n]*))", "gi");
    arrData = [[]];
    arrMatches = null;
    while (arrMatches = objPattern.exec(strData)) {
      strMatchedDelimiter = arrMatches[1];
      if (strMatchedDelimiter.length && (strMatchedDelimiter !== strDelimiter)) {
        arrData.push([]);
      }
      if (arrMatches[2]) {
        strMatchedValue = arrMatches[2].replace(new RegExp("\"\"", "g"), "\"");
      } else {
        strMatchedValue = arrMatches[3];
      }
      arrData[arrData.length - 1].push(strMatchedValue);
    }
    return arrData;
  };

  arrayToJson = function(array) {
    var cols, row, rowToObject, _i, _len, _results;
    cols = array.shift();
    rowToObject = function(row) {
      var k, obj, v, _i, _len, _ref, _ref1;
      obj = {};
      _ref = _.zip(cols, row);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _ref1 = _ref[_i], k = _ref1[0], v = _ref1[1];
        if ((v != null) && (v.match(/\S/)) && v !== 'NULL') {
          obj[k] = v;
        }
      }
      return obj;
    };
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      row = array[_i];
      _results.push(rowToObject(row));
    }
    return _results;
  };

}).call(this);
