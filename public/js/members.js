$(function(){

    $('#übersicht-tab').on('click',function(){

        $.ajax({
            type: 'GET',
            url: '/hbreaks',
            success: function(breaks){
                console.log({breaks});

                $.each(breaks,function(i, element){
                    var Datum = moment(element.datum).format('DD.MM.YYYY');
                    $('#navbarNavAltMarkup').removeClass('show');
                    $('#highBreaks').append('<tr><td>'+Datum+'</td><td>'+element.player+'</td><td>'+element.break+'</td></tr>');
                });
            }
        })
    });
});