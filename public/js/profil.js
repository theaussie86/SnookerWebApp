$(function(){
    $('#change').on('click', function() {
        var prev = $('.change'),
            ro   = prev.prop('readonly');
        prev.prop('readonly', !ro).focus();
        $(this).text(function(i, text){
            return text === 'Ändern' ? 'Speichern' : 'Ändern';
        });
        console.log($(this).text());
        if ($(this).text()==='Ändern'){
            $('#profileform').submit();
        }
    });
});