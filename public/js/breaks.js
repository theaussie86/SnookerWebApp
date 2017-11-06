$(function(){
    
    $.ajax({
        type: 'GET',
        url: '/breaks/get',
        success: function(breaks){
            $.each(breaks,function(i, element){
                var Datum = moment(element.datum).format('DD.MM.YYYY');
                $('#navbarNavAltMarkup').removeClass('show');
                $('#myBreaks').append('<tr><th>'+(i+1)+'.'+'</th><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.break+'</td></tr>');
            });
        }
    });
});