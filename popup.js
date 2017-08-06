$(document).ready(function() {
  var current_url;
  var drink_name;
  var is_on_drink_page;

  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    var tab = tabs[0];
    current_url = tab.url;
    drink_name = getDrinkName(tab.title);
    is_on_drink_page = determinePage(current_url);
    if (is_on_drink_page) {
      showDrinkForm();
      checkIfDrinkExists(current_url);
    } else {
      showDrinksList();
      showHelperDrinkMessage();
      hideDrinksListToggle();
    }
    $("#drink_name").text(drink_name);
  });

  function getDrinkName(full_title) {
    return full_title.split("|")[0].trim();
  }

  function determinePage(current_url) {
    var url_array = current_url.split("/").filter(Boolean);
    var last_url_piece = url_array[url_array.length-1];
    return (last_url_piece === "tuxedono2.com") ? false : true;
  }

  function showDrinkForm() {
    $(".drink_form").addClass("drink_form--on_drink_page");
  }

  function showDrinksList() {
    populateDrinksList();
    $(".drinks_list_container").addClass("drinks_list_container--show");
  }

  function showHelperDrinkMessage() {
    $(".not_on_drink_page").addClass("not_on_drink_page--show");
  }

  function hideDrinksListToggle() {
    $(".see_all_drinks").hide();
  }

  function populateDrinksList() {
    var $drinks_list = $(".drinks_list");
    $drinks_list.empty();
    chrome.storage.sync.get('drinks', function(results) {
      var drinks = results.drinks;

      if (!drinks.length) {
        $(".no_drinks_yet").addClass("no_drinks_yet--show");
      } else {
        $(".no_drinks_yet").removeClass("no_drinks_yet--show");
        $.each(drinks, function() {
          var drink = this;
          var html = $('<li/>');
          html.append(
            $('<a/>', { href: drink.url, text: drink.name, 'class': 'drinks_list-link' })
          ).append(
            $('<a/>', { text: 'edit', 'class': 'drinks_list-edit', 'edit-drink': drink.url })
          ).append(
            $('<p/>', { text: 'Notes: ' + drink.notes })
          );
          $drinks_list.append(html);
        });
      }
    });
  }

  function checkIfDrinkExists(url) {
    chrome.storage.sync.get(["drinks"], function(results) {
      var found_result = checkResults(results.drinks, url);
      if (found_result.length) {
        $("button.created_button").prop("value", true);
        $("textarea").val(found_result[0].notes);
        // This sets it for all tabs & even if the result isn't saved - weird!
        // chrome.browserAction.setIcon({path: "icon-saved.png"});
      }
    });
  }

  function checkResults(results, url) {
    return $.grep(results, function(e) {
      return e.url === url;
    });
  }

  function removePreviousDrink(results, url) {
    return $.grep(results, function(e) {
      return e.url != url;
    });
  }

  function saveDrink() {
    var button_selected = $("button.created_button").prop("value") === "true";
    var notes = $("textarea").val();

    if (!button_selected) {
      $("#save_error").addClass("save_error--has_error");
    } else {
      var drink = {
        'url': current_url,
        'name': drink_name,
        'notes': notes
      };

      chrome.storage.sync.get(["drinks"], function(results) {
        if (results.drinks) {
          var found_result = checkResults(results.drinks, current_url);
          if (found_result.length) {
            results.drinks = removePreviousDrink(results.drinks, current_url);
          }
          results.drinks.push(drink);
        } else {
          results.drinks = [drink];
        }

        chrome.storage.sync.set(results, function() {
          // Notes saved!
          $("#save_error").removeClass("save_error--has_error");
          $("#save_message").addClass("save_message--success");

          if ($(".drinks_list_container").hasClass("drinks_list_container--show")) {
            populateDrinksList();
          }
        });
      });
    }
  }

  function clearAllSavedDrinks() {
    chrome.storage.sync.get(["drinks"], function(results) {
      results.drinks = [];

      chrome.storage.sync.set(results, function() {
        // Notes deleted!
      });
    });
  }

  $(".save_drink").on("click", saveDrink);

  $(".see_all_drinks").on("click", function() {
    $(this).hide();
    showDrinksList();
  })

  $(".created_button").on("click", function() {
    $this = $(this);
    $this.val(function() {
      return $this.val() === "false" ? true : false;
    });
  });
});
