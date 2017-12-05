$(function(){
    $('.deleteBreak').on('click',function(){
        var $row = $(this).closest('tr').children();
        
        var datum= $row[0].textContent;
        var player= $row[1].textContent;
        var serie= $row[2].textContent;

        $.ajax({
            type: 'GET',
            url: '/board/deletebreak/'+datum+'/'+player+'/'+serie,
            success: function(serie){
                location.reload();
            }
        });
    });

    $('.editBreak').on('click',function(){
        var $row = $(this).closest('tr').children();
        
        var datum= $row[0].textContent;
        var player= $row[1].textContent;
        var serie= $row[2].textContent;

        $.ajax({
            type: 'GET',
            url: '/board/editbreak/'+datum+'/'+player+'/'+serie,
            success: function(serie){
                $('#breakdatum').attr('placeholder',moment(serie.datum).format('DD.MM.YYYY'));
                $('#player').attr('placeholder',serie.player);
                $('#break').attr('placeholder',serie.break);
            }
        });
    });

    $('#change').on('click', function() {
        var prev = $('.change'),
            ro   = prev.prop('disabled', function(i, v) { return !v; });
        $(this).text(function(i, text){
            return text === 'Ändern' ? 'Speichern' : 'Ändern';
        });
        console.log($(this).text());
        if ($(this).text()==='Ändern'){
            $('#editbreakform').submit();
        }
    });
});