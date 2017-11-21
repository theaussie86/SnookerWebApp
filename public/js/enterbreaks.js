$(function(){
    $("#member").on('change',function(e) {
        $("#spieler").prop("readonly", !$(this).is(":checked"));
    });
});            