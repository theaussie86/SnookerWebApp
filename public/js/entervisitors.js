$(function(){
    $("#onlyguests").on('change',function(e) {
        $("#spieler1").prop("readonly", !$(this).is(":checked"));
    });
});