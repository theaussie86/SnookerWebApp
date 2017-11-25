$(function(){
    var cboyear = 2015;
    while (cboyear<=new Date().getFullYear()) {
        $('#year').append('<option value="'+cboyear+'">'+cboyear+'</option>')
        cboyear++;
    }

    var username = $('#username').text().split(' ');

    $('#month').on('change',function(){
        var monat= $('#month').val();
        var jahr= $('#year').val();

    $('#Umsatzsumme').empty();
    $('#myVisitors').empty();        

        $.ajax({
            type: 'GET',
            url: '/members/visitors/get/'+monat+'/'+jahr,
            success: function(rents){
                var umsatzsumme=parseRents(rents);                

                $('#Umsatzsumme').text(umsatzsumme.toFixed(2).replace('.',',')+' €');
            }
        });
    });

    $('#year').on('change',function(){
        var monat= $('#month').val();
        var jahr= $('#year').val();

        $('#Umsatzsumme').empty();
        $('#myVisitors').empty();

        $.ajax({
            type: 'GET',
            url: '/members/visitors/get/'+monat+'/'+jahr,
            success: function(rents){
                var umsatzsumme=parseRents(rents);
                
                $('#Umsatzsumme').text(umsatzsumme.toFixed(2).replace('.',',')+' €');
            }
        });
    });

    var parseRents = function(rents){
        var umsatzsumme = 0;
        $.each(rents,function(i, element){
            umsatzsumme +=element.betrag;
            var Datum = moment(element.datum).format('DD.MM.YYYY');
            var pl;
            if (element.onlyGuests) {
                pl= element.player1+' und '+element.player2;
            } else if(element.player1 === username[1]){
                pl= element.player2;
            } else {
                pl= element.player1;
            }
            $('#navbarNavAltMarkup').removeClass('show');
            $('#myVisitors').append('<tr><td>'+Datum+'</td><td>'+pl+'</td><td>'+element.spielzeit.toFixed(1).replace('.',',')+' h'+'</td><td>'+element.betrag.toFixed(2).replace('.', ",")+' €'+'</td></tr>');
        });
        return umsatzsumme;
    }
});