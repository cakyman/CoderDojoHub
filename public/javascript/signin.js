var hiddenVal = document.getElementById("hidden");
var nameForm = document.getElementById("nameForm");
var submit = document.getElementById("signbutton");
function change(type, name) {
    if(type) {
        hiddenVal.value = "signout";
        submit.attributes.class = "sign out button";
        submit.innerHTML = "Sign Out";
        nameForm.value = name;

    } else {
        hiddenVal.value = "signin";
        submit.attributes.class = "sign in button";
        submit.innerHTML = "Sign In";
    }
}